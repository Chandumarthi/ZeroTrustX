"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const database_1 = require("../config/database");
const logger_1 = require("../config/logger");
const env_1 = require("../config/env");
const crypto_utils_1 = require("../utils/crypto.utils");
const device_service_1 = require("../services/device.service");
const risk_service_1 = require("../services/risk.service");
const audit_service_1 = require("../services/audit.service");
const email_service_1 = require("../services/email.service");
class AuthController {
    /**
     * Helper to extract client IP address accurately
     */
    getClientIp(req) {
        const forwarded = req.headers['x-forwarded-for'];
        if (typeof forwarded === 'string') {
            return forwarded.split(',')[0].trim();
        }
        return req.socket.remoteAddress || '127.0.0.1';
    }
    /**
     * Helper to extract User Agent
     */
    getUserAgent(req) {
        return req.headers['user-agent'] || 'Unknown-Client';
    }
    /**
     * POST /api/auth/register
     * Registers a new user account with strong password hashing
     */
    async register(req, res) {
        const { email, password } = req.body;
        const fullName = req.body.fullName || req.body.name;
        const ipAddress = this.getClientIp(req);
        const userAgent = this.getUserAgent(req);
        try {
            const existingUser = await database_1.prisma.user.findUnique({
                where: { email },
            });
            if (existingUser) {
                res.status(409).json({
                    success: false,
                    error: 'An account with this email address already exists.',
                });
                return;
            }
            const passwordHash = await (0, crypto_utils_1.hashPassword)(password);
            const user = await database_1.prisma.user.create({
                data: {
                    email,
                    passwordHash,
                    fullName,
                    role: 'USER',
                    isActive: true,
                    emailVerified: false,
                },
            });
            await audit_service_1.auditService.logEvent({
                userId: user.id,
                eventType: 'USER_REGISTERED',
                action: 'REGISTER',
                resourceType: 'USER',
                resourceId: user.id,
                ipAddress,
                userAgent,
                severity: 'INFO',
                metadata: { email: user.email },
            });
            await audit_service_1.auditService.logAuthEvent({
                userId: user.id,
                eventType: 'REGISTER',
                success: true,
                ipAddress,
                userAgent,
            });
            res.status(201).json({
                success: true,
                message: 'Account successfully registered. Please proceed to login.',
                data: {
                    id: user.id,
                    email: user.email,
                    fullName: user.fullName,
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Registration failed unexpectedly', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'An error occurred while creating your account.',
            });
        }
    }
    /**
     * POST /api/auth/login
     * Adaptive risk-based login evaluation
     */
    async login(req, res) {
        const { email, password } = req.body;
        const ipAddress = this.getClientIp(req);
        const userAgent = this.getUserAgent(req);
        const deviceFingerprint = device_service_1.deviceService.generateDeviceFingerprint(userAgent, ipAddress);
        try {
            const user = await database_1.prisma.user.findUnique({
                where: { email },
                include: {
                    devices: true,
                },
            });
            // Generic authentication failure response to prevent user enumeration
            const invalidCredentialsResponse = () => {
                res.status(401).json({
                    success: false,
                    error: 'Invalid email or password.',
                });
            };
            if (!user) {
                // Log failed attempt for unknown user email in audit
                await audit_service_1.auditService.logEvent({
                    eventType: 'LOGIN_FAILURE_UNKNOWN_USER',
                    action: 'LOGIN',
                    resourceType: 'USER',
                    ipAddress,
                    userAgent,
                    severity: 'MEDIUM',
                    metadata: { attemptedEmail: email },
                });
                invalidCredentialsResponse();
                return;
            }
            if (!user.isActive) {
                res.status(403).json({
                    success: false,
                    error: 'Your account has been deactivated. Please contact support.',
                });
                return;
            }
            const passwordValid = await (0, crypto_utils_1.verifyPassword)(password, user.passwordHash);
            if (!passwordValid) {
                await audit_service_1.auditService.logAuthEvent({
                    userId: user.id,
                    eventType: 'LOGIN_FAILURE',
                    success: false,
                    ipAddress,
                    userAgent,
                    failureReason: 'Invalid password',
                });
                await audit_service_1.auditService.logEvent({
                    userId: user.id,
                    eventType: 'LOGIN_FAILURE',
                    action: 'LOGIN',
                    resourceType: 'USER',
                    resourceId: user.id,
                    ipAddress,
                    userAgent,
                    severity: 'MEDIUM',
                });
                invalidCredentialsResponse();
                return;
            }
            // ---------------------------------------------------------
            // Collect Risk Features for Adaptive Engine
            // ---------------------------------------------------------
            const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const [recentFailures, pastSuccessfulLogins, lastLoginEvent] = await Promise.all([
                database_1.prisma.authenticationEvent.count({
                    where: {
                        userId: user.id,
                        eventType: 'LOGIN_FAILURE',
                        createdAt: { gte: fifteenMinutesAgo },
                    },
                }),
                database_1.prisma.authenticationEvent.count({
                    where: {
                        userId: user.id,
                        success: true,
                        createdAt: { gte: thirtyDaysAgo },
                    },
                }),
                database_1.prisma.authenticationEvent.findFirst({
                    where: {
                        userId: user.id,
                        success: true,
                    },
                    orderBy: { createdAt: 'desc' },
                }),
            ]);
            const deviceKnown = await device_service_1.deviceService.isDeviceKnown(user.id, deviceFingerprint);
            // Check if IP has been used in previous successful logins
            const knownIpEvent = await database_1.prisma.authenticationEvent.findFirst({
                where: {
                    userId: user.id,
                    ipAddress,
                    success: true,
                },
            });
            const ipKnown = !!knownIpEvent;
            const now = new Date();
            const loginHour = now.getHours();
            let timeSinceLastLogin = 0;
            if (user.lastLoginAt) {
                timeSinceLastLogin = Math.max(0, Math.round(((now.getTime() - new Date(user.lastLoginAt).getTime()) / (1000 * 60 * 60)) * 10) / 10);
            }
            const loginFrequency = Math.round((pastSuccessfulLogins / 30) * 10) / 10;
            const ipChanged = lastLoginEvent ? lastLoginEvent.ipAddress !== ipAddress : false;
            // Check if the previous device was different
            let deviceChanged = false;
            if (lastLoginEvent && lastLoginEvent.deviceId) {
                const lastDevice = await database_1.prisma.device.findUnique({ where: { id: lastLoginEvent.deviceId } });
                if (lastDevice && lastDevice.deviceFingerprint !== deviceFingerprint) {
                    deviceChanged = true;
                }
            }
            const riskFeatures = {
                userId: user.id,
                deviceKnown,
                ipKnown,
                recentFailedAttempts: recentFailures,
                loginHour,
                timeSinceLastLogin,
                deviceChanged,
                loginFrequency,
                ipChanged,
                userAgent,
                ipAddress,
            };
            // Create an initial auth event record
            const authEvent = await audit_service_1.auditService.logAuthEvent({
                userId: user.id,
                eventType: 'LOGIN_ATTEMPT',
                success: true,
                ipAddress,
                userAgent,
            });
            // Assess Risk
            const assessment = await risk_service_1.riskService.assessRisk(riskFeatures, authEvent?.id, false);
            // Update auth event with risk metrics
            if (authEvent) {
                await database_1.prisma.authenticationEvent.update({
                    where: { id: authEvent.id },
                    data: {
                        riskScore: assessment.riskScore,
                        riskLevel: assessment.riskLevel,
                        accessDecision: assessment.accessDecision,
                    },
                });
            }
            // Handle Access Decisions
            if (assessment.accessDecision === 'BLOCK') {
                await audit_service_1.auditService.logAuthEvent({
                    userId: user.id,
                    eventType: 'ACCESS_DENIED',
                    success: false,
                    ipAddress,
                    userAgent,
                    riskScore: assessment.riskScore,
                    riskLevel: assessment.riskLevel,
                    accessDecision: 'BLOCK',
                    failureReason: 'Blocked by adaptive risk policy due to critical risk',
                });
                res.status(403).json({
                    success: false,
                    error: 'Access blocked due to critical risk detection. Contact security administrator.',
                    details: {
                        riskLevel: assessment.riskLevel,
                        riskScore: assessment.riskScore,
                    },
                });
                return;
            }
            if (assessment.accessDecision === 'RESTRICT') {
                await audit_service_1.auditService.logAuthEvent({
                    userId: user.id,
                    eventType: 'ACCESS_DENIED',
                    success: false,
                    ipAddress,
                    userAgent,
                    riskScore: assessment.riskScore,
                    riskLevel: assessment.riskLevel,
                    accessDecision: 'RESTRICT',
                    failureReason: 'High risk detected. Access restricted.',
                });
                res.status(403).json({
                    success: false,
                    error: 'Access restricted due to unusual activity. Verification cannot proceed.',
                    details: {
                        riskLevel: assessment.riskLevel,
                        riskScore: assessment.riskScore,
                    },
                });
                return;
            }
            if (assessment.accessDecision === 'STEP_UP_VERIFICATION') {
                // Generate single-use OTP
                const otpCode = (0, crypto_utils_1.generateOTP)();
                const codeHash = await (0, crypto_utils_1.hashOTP)(otpCode);
                const expiresAt = new Date(Date.now() + env_1.config.OTP_EXPIRES_IN_SECONDS * 1000);
                const challenge = await database_1.prisma.oTPChallenge.create({
                    data: {
                        userId: user.id,
                        codeHash,
                        expiresAt,
                        ipAddress,
                        userAgent,
                        attempts: 0,
                    },
                });
                // Dispatch OTP via configured email provider
                await email_service_1.emailService.sendOTP(user.email, user.fullName, otpCode, Math.round(env_1.config.OTP_EXPIRES_IN_SECONDS / 60));
                await audit_service_1.auditService.logAuthEvent({
                    userId: user.id,
                    eventType: 'STEP_UP_REQUIRED',
                    success: true,
                    ipAddress,
                    userAgent,
                    riskScore: assessment.riskScore,
                    riskLevel: assessment.riskLevel,
                    accessDecision: 'STEP_UP_VERIFICATION',
                });
                res.status(200).json({
                    success: true,
                    requiresOTP: true,
                    challengeId: challenge.id,
                    message: 'Step-up verification required. A security code has been dispatched.',
                    data: {
                        requiresOTP: true,
                        challengeId: challenge.id,
                        risk: {
                            level: assessment.riskLevel,
                            score: assessment.riskScore,
                            explanation: assessment.explanation,
                        },
                    },
                    risk: {
                        level: assessment.riskLevel,
                        score: assessment.riskScore,
                        explanation: assessment.explanation,
                    },
                });
                return;
            }
            // Decision is ALLOW (Direct Access)
            const recordedDevice = await device_service_1.deviceService.recordDevice(user.id, userAgent, ipAddress);
            const jti = (0, crypto_utils_1.generateJti)();
            const tokens = (0, crypto_utils_1.generateTokens)(user.id, user.role, jti);
            await database_1.prisma.user.update({
                where: { id: user.id },
                data: { lastLoginAt: new Date() },
            });
            await audit_service_1.auditService.logAuthEvent({
                userId: user.id,
                eventType: 'LOGIN_SUCCESS',
                success: true,
                ipAddress,
                userAgent,
                deviceId: recordedDevice.id,
                riskScore: assessment.riskScore,
                riskLevel: assessment.riskLevel,
                accessDecision: 'ALLOW',
            });
            // Set HttpOnly access token cookie
            res.cookie('accessToken', tokens.accessToken, {
                httpOnly: true,
                secure: env_1.config.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 15 * 60 * 1000, // 15 mins
            });
            res.status(200).json({
                success: true,
                requiresOTP: false,
                message: 'Authentication successful.',
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        fullName: user.fullName,
                        name: user.fullName,
                        role: user.role,
                    },
                    token: tokens.accessToken,
                    tokens,
                    risk: {
                        score: assessment.riskScore,
                        level: assessment.riskLevel,
                    },
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Login process encountered error', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'An internal authentication error occurred.',
            });
        }
    }
    /**
     * POST /api/auth/verify-otp
     * Validates step-up OTP challenge and completes authentication
     */
    async verifyOTP(req, res) {
        const { challengeId, otp } = req.body;
        const ipAddress = this.getClientIp(req);
        const userAgent = this.getUserAgent(req);
        try {
            const challenge = await database_1.prisma.oTPChallenge.findUnique({
                where: { id: challengeId },
                include: { user: true },
            });
            if (!challenge) {
                res.status(404).json({
                    success: false,
                    error: 'Verification challenge not found.',
                });
                return;
            }
            if (challenge.usedAt) {
                res.status(400).json({
                    success: false,
                    error: 'This verification challenge has already been used.',
                });
                return;
            }
            if (new Date() > challenge.expiresAt) {
                await audit_service_1.auditService.logAuthEvent({
                    userId: challenge.userId,
                    eventType: 'OTP_EXPIRED',
                    success: false,
                    ipAddress,
                    userAgent,
                    failureReason: 'Verification code expired',
                });
                res.status(400).json({
                    success: false,
                    error: 'Verification code has expired. Please request a new code.',
                });
                return;
            }
            if (challenge.attempts >= env_1.config.OTP_MAX_ATTEMPTS) {
                await audit_service_1.auditService.logAuthEvent({
                    userId: challenge.userId,
                    eventType: 'OTP_FAILED',
                    success: false,
                    ipAddress,
                    userAgent,
                    failureReason: 'Maximum verification attempts exceeded',
                });
                res.status(429).json({
                    success: false,
                    error: 'Maximum verification attempts exceeded. Please initiate login again.',
                });
                return;
            }
            const isValid = await (0, crypto_utils_1.verifyOTP)(otp, challenge.codeHash);
            if (!isValid) {
                await database_1.prisma.oTPChallenge.update({
                    where: { id: challenge.id },
                    data: { attempts: { increment: 1 } },
                });
                await audit_service_1.auditService.logAuthEvent({
                    userId: challenge.userId,
                    eventType: 'OTP_FAILED',
                    success: false,
                    ipAddress,
                    userAgent,
                    failureReason: 'Incorrect OTP code entered',
                });
                const remainingAttempts = env_1.config.OTP_MAX_ATTEMPTS - (challenge.attempts + 1);
                res.status(400).json({
                    success: false,
                    error: `Invalid verification code. ${remainingAttempts} attempts remaining.`,
                });
                return;
            }
            // OTP Verification Succeeded
            await database_1.prisma.oTPChallenge.update({
                where: { id: challenge.id },
                data: { usedAt: new Date() },
            });
            // Record device as trusted and known
            const recordedDevice = await device_service_1.deviceService.recordDevice(challenge.userId, userAgent, ipAddress);
            // Issue tokens
            const jti = (0, crypto_utils_1.generateJti)();
            const tokens = (0, crypto_utils_1.generateTokens)(challenge.userId, challenge.user.role, jti);
            await database_1.prisma.user.update({
                where: { id: challenge.userId },
                data: {
                    lastLoginAt: new Date(),
                    emailVerified: true,
                },
            });
            await audit_service_1.auditService.logAuthEvent({
                userId: challenge.userId,
                eventType: 'OTP_VERIFIED',
                success: true,
                ipAddress,
                userAgent,
                deviceId: recordedDevice.id,
            });
            await audit_service_1.auditService.logAuthEvent({
                userId: challenge.userId,
                eventType: 'LOGIN_SUCCESS',
                success: true,
                ipAddress,
                userAgent,
                deviceId: recordedDevice.id,
            });
            res.cookie('accessToken', tokens.accessToken, {
                httpOnly: true,
                secure: env_1.config.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 15 * 60 * 1000,
            });
            res.status(200).json({
                success: true,
                message: 'Step-up verification successful.',
                data: {
                    user: {
                        id: challenge.user.id,
                        email: challenge.user.email,
                        fullName: challenge.user.fullName,
                        name: challenge.user.fullName,
                        role: challenge.user.role,
                    },
                    token: tokens.accessToken,
                    tokens,
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Error verifying OTP', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Internal error during verification.',
            });
        }
    }
    /**
     * POST /api/auth/resend-otp
     * Requests a new OTP for an active challenge with cooldown enforcement
     */
    async resendOTP(req, res) {
        const { challengeId } = req.body;
        const ipAddress = this.getClientIp(req);
        const userAgent = this.getUserAgent(req);
        try {
            const challenge = await database_1.prisma.oTPChallenge.findUnique({
                where: { id: challengeId },
                include: { user: true },
            });
            if (!challenge) {
                res.status(404).json({
                    success: false,
                    error: 'Verification challenge not found.',
                });
                return;
            }
            // Check cooldown window (60s)
            const elapsedSeconds = Math.floor((Date.now() - new Date(challenge.createdAt).getTime()) / 1000);
            if (elapsedSeconds < env_1.config.OTP_RESEND_COOLDOWN_SECONDS) {
                const remaining = env_1.config.OTP_RESEND_COOLDOWN_SECONDS - elapsedSeconds;
                res.status(429).json({
                    success: false,
                    error: `Please wait ${remaining} seconds before requesting a new code.`,
                });
                return;
            }
            // Invalidate old challenge
            await database_1.prisma.oTPChallenge.update({
                where: { id: challenge.id },
                data: { usedAt: new Date() },
            });
            // Create new challenge
            const otpCode = (0, crypto_utils_1.generateOTP)();
            const codeHash = await (0, crypto_utils_1.hashOTP)(otpCode);
            const expiresAt = new Date(Date.now() + env_1.config.OTP_EXPIRES_IN_SECONDS * 1000);
            const newChallenge = await database_1.prisma.oTPChallenge.create({
                data: {
                    userId: challenge.userId,
                    codeHash,
                    expiresAt,
                    ipAddress,
                    userAgent,
                    attempts: 0,
                },
            });
            await email_service_1.emailService.sendOTP(challenge.user.email, challenge.user.fullName, otpCode, Math.round(env_1.config.OTP_EXPIRES_IN_SECONDS / 60));
            await audit_service_1.auditService.logAuthEvent({
                userId: challenge.userId,
                eventType: 'OTP_REQUESTED',
                success: true,
                ipAddress,
                userAgent,
            });
            res.status(200).json({
                success: true,
                challengeId: newChallenge.id,
                message: 'A fresh verification code has been dispatched to your email.',
            });
        }
        catch (error) {
            logger_1.logger.error('Error resending OTP', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Failed to resend verification code.',
            });
        }
    }
    /**
     * POST /api/auth/logout
     * Explicit session revocation and cookie clearing
     */
    async logout(req, res) {
        const ipAddress = this.getClientIp(req);
        const userAgent = this.getUserAgent(req);
        try {
            if (req.user && req.user.jti) {
                await database_1.prisma.sessionRevocation.create({
                    data: {
                        tokenJti: req.user.jti,
                        userId: req.user.id,
                        reason: 'User explicit logout',
                    },
                });
                await audit_service_1.auditService.logAuthEvent({
                    userId: req.user.id,
                    eventType: 'LOGOUT',
                    success: true,
                    ipAddress,
                    userAgent,
                });
                await audit_service_1.auditService.logEvent({
                    userId: req.user.id,
                    eventType: 'USER_LOGOUT',
                    action: 'LOGOUT',
                    resourceType: 'SESSION',
                    resourceId: req.user.jti,
                    ipAddress,
                    userAgent,
                    severity: 'INFO',
                });
            }
            res.clearCookie('accessToken');
            res.status(200).json({
                success: true,
                message: 'Logged out successfully. Session revoked.',
            });
        }
        catch (error) {
            logger_1.logger.error('Error during logout', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Failed to complete logout.',
            });
        }
    }
    /**
     * GET /api/auth/me
     * Return authenticated user profile details
     */
    async me(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: 'Unauthorized',
                });
                return;
            }
            const user = await database_1.prisma.user.findUnique({
                where: { id: req.user.id },
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    role: true,
                    isActive: true,
                    emailVerified: true,
                    createdAt: true,
                    updatedAt: true,
                    lastLoginAt: true,
                },
            });
            if (!user) {
                res.status(404).json({
                    success: false,
                    error: 'User not found.',
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: user,
            });
        }
        catch (error) {
            logger_1.logger.error('Error retrieving user profile in /me', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Failed to fetch user profile.',
            });
        }
    }
    /**
     * POST /api/auth/bootstrap-admin
     * Safe initialization of initial system administrator
     */
    async bootstrapAdmin(req, res) {
        const { email, password, fullName, bootstrapSecret } = req.body;
        const ipAddress = this.getClientIp(req);
        const userAgent = this.getUserAgent(req);
        try {
            if (!env_1.config.ADMIN_BOOTSTRAP_SECRET || bootstrapSecret !== env_1.config.ADMIN_BOOTSTRAP_SECRET) {
                logger_1.logger.warn('Failed admin bootstrap attempt - invalid bootstrap secret', { ip: ipAddress });
                res.status(403).json({
                    success: false,
                    error: 'Forbidden. Invalid administrator bootstrap secret.',
                });
                return;
            }
            const existingAdmin = await database_1.prisma.user.findFirst({
                where: { role: 'ADMIN' },
            });
            if (existingAdmin) {
                res.status(400).json({
                    success: false,
                    error: 'System administrator already initialized. Bootstrap disabled.',
                });
                return;
            }
            const passwordHash = await (0, crypto_utils_1.hashPassword)(password);
            const adminUser = await database_1.prisma.user.create({
                data: {
                    email,
                    passwordHash,
                    fullName,
                    role: 'ADMIN',
                    isActive: true,
                    emailVerified: true,
                },
            });
            await audit_service_1.auditService.logEvent({
                userId: adminUser.id,
                eventType: 'ADMIN_BOOTSTRAPPED',
                action: 'BOOTSTRAP',
                resourceType: 'USER',
                resourceId: adminUser.id,
                ipAddress,
                userAgent,
                severity: 'CRITICAL',
                metadata: { email: adminUser.email },
            });
            res.status(201).json({
                success: true,
                message: 'Initial administrator successfully created.',
                data: {
                    id: adminUser.id,
                    email: adminUser.email,
                    fullName: adminUser.fullName,
                    role: adminUser.role,
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Admin bootstrap error', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Failed to bootstrap administrator account.',
            });
        }
    }
}
exports.AuthController = AuthController;
exports.authController = new AuthController();
//# sourceMappingURL=auth.controller.js.map