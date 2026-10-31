import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { config } from '../config/env';
import {
  hashPassword,
  verifyPassword,
  generateOTP,
  hashOTP,
  verifyOTP,
  generateTokens,
  generateJti,
} from '../utils/crypto.utils';
import { deviceService } from '../services/device.service';
import { riskService } from '../services/risk.service';
import { auditService } from '../services/audit.service';
import { emailService } from '../services/email.service';
import { RiskFeatures } from '../types';

export class AuthController {
  /**
   * Helper to extract client IP address accurately
   */
  private getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return req.socket.remoteAddress || '127.0.0.1';
  }

  /**
   * Helper to extract User Agent
   */
  private getUserAgent(req: Request): string {
    return req.headers['user-agent'] || 'Unknown-Client';
  }

  /**
   * POST /api/auth/register
   * Registers a new user account with strong password hashing
   */
  async register(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;
    const fullName = req.body.fullName || req.body.name;
    const ipAddress = this.getClientIp(req);
    const userAgent = this.getUserAgent(req);

    try {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        res.status(409).json({
          success: false,
          error: 'An account with this email address already exists.',
        });
        return;
      }

      const passwordHash = await hashPassword(password);

      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          fullName,
          role: 'USER',
          isActive: true,
          emailVerified: false,
        },
      });

      await auditService.logEvent({
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

      await auditService.logAuthEvent({
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
    } catch (error: any) {
      logger.error('Registration failed unexpectedly', { error: error.message });
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
  async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;
    const ipAddress = this.getClientIp(req);
    const userAgent = this.getUserAgent(req);
    const deviceFingerprint = deviceService.generateDeviceFingerprint(userAgent, ipAddress);

    try {
      const user = await prisma.user.findUnique({
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
        await auditService.logEvent({
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

      const passwordValid = await verifyPassword(password, user.passwordHash);

      if (!passwordValid) {
        await auditService.logAuthEvent({
          userId: user.id,
          eventType: 'LOGIN_FAILURE',
          success: false,
          ipAddress,
          userAgent,
          failureReason: 'Invalid password',
        });

        await auditService.logEvent({
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
        prisma.authenticationEvent.count({
          where: {
            userId: user.id,
            eventType: 'LOGIN_FAILURE',
            createdAt: { gte: fifteenMinutesAgo },
          },
        }),
        prisma.authenticationEvent.count({
          where: {
            userId: user.id,
            success: true,
            createdAt: { gte: thirtyDaysAgo },
          },
        }),
        prisma.authenticationEvent.findFirst({
          where: {
            userId: user.id,
            success: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      const deviceKnown = await deviceService.isDeviceKnown(user.id, deviceFingerprint);

      // Check if IP has been used in previous successful logins
      const knownIpEvent = await prisma.authenticationEvent.findFirst({
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
        timeSinceLastLogin = Math.max(
          0,
          Math.round(((now.getTime() - new Date(user.lastLoginAt).getTime()) / (1000 * 60 * 60)) * 10) / 10
        );
      }

      const loginFrequency = Math.round((pastSuccessfulLogins / 30) * 10) / 10;
      const ipChanged = lastLoginEvent ? lastLoginEvent.ipAddress !== ipAddress : false;

      // Check if the previous device was different
      let deviceChanged = false;
      if (lastLoginEvent && lastLoginEvent.deviceId) {
        const lastDevice = await prisma.device.findUnique({ where: { id: lastLoginEvent.deviceId } });
        if (lastDevice && lastDevice.deviceFingerprint !== deviceFingerprint) {
          deviceChanged = true;
        }
      }

      const riskFeatures: RiskFeatures = {
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
      const authEvent = await auditService.logAuthEvent({
        userId: user.id,
        eventType: 'LOGIN_ATTEMPT',
        success: true,
        ipAddress,
        userAgent,
      });

      // Assess Risk
      const assessment = await riskService.assessRisk(riskFeatures, authEvent?.id, false);

      // Update auth event with risk metrics
      if (authEvent) {
        await prisma.authenticationEvent.update({
          where: { id: authEvent.id },
          data: {
            riskScore: assessment.riskScore,
            riskLevel: assessment.riskLevel as any,
            accessDecision: assessment.accessDecision as any,
          },
        });
      }

      // Handle Access Decisions
      if (assessment.accessDecision === 'BLOCK') {
        await auditService.logAuthEvent({
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
        await auditService.logAuthEvent({
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

      if (assessment.accessDecision === 'STEP_UP_VERIFICATION' || !user.emailVerified) {
        // Generate single-use OTP
        const otpCode = generateOTP();
        const codeHash = await hashOTP(otpCode);
        const expiresAt = new Date(Date.now() + config.OTP_EXPIRES_IN_SECONDS * 1000);

        const challenge = await prisma.oTPChallenge.create({
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
        await emailService.sendOTP(
          user.email,
          user.fullName,
          otpCode,
          Math.round(config.OTP_EXPIRES_IN_SECONDS / 60)
        );

        await auditService.logAuthEvent({
          userId: user.id,
          eventType: 'STEP_UP_REQUIRED',
          success: true,
          ipAddress,
          userAgent,
          riskScore: assessment.riskScore,
          riskLevel: assessment.riskLevel,
          accessDecision: 'STEP_UP_VERIFICATION',
        });

        const challengeId = challenge?.id || '';
        const maskedEmail = user.email.replace(/(.{2})(.*)(?=@)/, (_gp, a, b) => a + '*'.repeat(Math.max(1, b.length)));

        res.status(200).json({
          success: true,
          requiresOTP: true,
          challengeId,
          emailMasked: maskedEmail,
          message: 'Step-up verification required. A security code has been dispatched.',
          data: {
            requiresOTP: true,
            challengeId,
            emailMasked: maskedEmail,
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
      const recordedDevice = await deviceService.recordDevice(user.id, userAgent, ipAddress);
      const jti = generateJti();
      const tokens = generateTokens(user.id, user.role as any, jti);

      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      await auditService.logAuthEvent({
        userId: user.id,
        eventType: 'LOGIN_SUCCESS',
        success: true,
        ipAddress,
        userAgent,
        deviceId: recordedDevice?.id,
        riskScore: assessment.riskScore,
        riskLevel: assessment.riskLevel,
        accessDecision: 'ALLOW',
      });

      // Set HttpOnly access token cookie
      res.cookie('accessToken', tokens.accessToken, {
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
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
    } catch (error: any) {
      logger.error('Login process encountered error', { error: error.message });
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
  async verifyOTP(req: Request, res: Response): Promise<void> {
    const { challengeId, otp } = req.body;
    const ipAddress = this.getClientIp(req);
    const userAgent = this.getUserAgent(req);

    try {
      let challenge = await prisma.oTPChallenge.findUnique({
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

      // If this challenge was superseded by a resend, resolve the active one for this user
      if (challenge.usedAt) {
        const activeChallenge = await prisma.oTPChallenge.findFirst({
          where: {
            userId: challenge.userId,
            usedAt: null,
            expiresAt: { gt: new Date() },
          },
          orderBy: { createdAt: 'desc' },
          include: { user: true },
        });

        if (activeChallenge) {
          challenge = activeChallenge;
        } else {
          res.status(400).json({
            success: false,
            error: 'This verification challenge has already been used.',
          });
          return;
        }
      }

      if (new Date() > challenge.expiresAt) {
        await auditService.logAuthEvent({
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

      if (challenge.attempts >= config.OTP_MAX_ATTEMPTS) {
        await auditService.logAuthEvent({
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

      const isValid = await verifyOTP(otp, challenge.codeHash);

      if (!isValid) {
        await prisma.oTPChallenge.update({
          where: { id: challenge.id },
          data: { attempts: { increment: 1 } },
        });

        await auditService.logAuthEvent({
          userId: challenge.userId,
          eventType: 'OTP_FAILED',
          success: false,
          ipAddress,
          userAgent,
          failureReason: 'Incorrect OTP code entered',
        });

        const remainingAttempts = config.OTP_MAX_ATTEMPTS - (challenge.attempts + 1);

        res.status(400).json({
          success: false,
          error: `Invalid verification code. ${remainingAttempts} attempts remaining.`,
        });
        return;
      }

      // OTP Verification Succeeded
      await prisma.oTPChallenge.update({
        where: { id: challenge.id },
        data: { usedAt: new Date() },
      });

      // Record device as trusted and known
      const recordedDevice = await deviceService.recordDevice(challenge.userId, userAgent, ipAddress);

      // Issue tokens
      const jti = generateJti();
      const tokens = generateTokens(challenge.userId, challenge.user.role as any, jti);

      await prisma.user.update({
        where: { id: challenge.userId },
        data: {
          lastLoginAt: new Date(),
          emailVerified: true,
        },
      });

      await auditService.logAuthEvent({
        userId: challenge.userId,
        eventType: 'OTP_VERIFIED',
        success: true,
        ipAddress,
        userAgent,
        deviceId: recordedDevice?.id,
      });

      await auditService.logAuthEvent({
        userId: challenge.userId,
        eventType: 'LOGIN_SUCCESS',
        success: true,
        ipAddress,
        userAgent,
        deviceId: recordedDevice?.id,
      });

      res.cookie('accessToken', tokens.accessToken, {
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
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
    } catch (error: any) {
      logger.error('Error verifying OTP', { error: error.message });
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
  async resendOTP(req: Request, res: Response): Promise<void> {
    const { challengeId } = req.body;
    const ipAddress = this.getClientIp(req);
    const userAgent = this.getUserAgent(req);

    try {
      const challenge = await prisma.oTPChallenge.findUnique({
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
      if (elapsedSeconds < config.OTP_RESEND_COOLDOWN_SECONDS) {
        const remaining = config.OTP_RESEND_COOLDOWN_SECONDS - elapsedSeconds;
        res.status(429).json({
          success: false,
          error: `Please wait ${remaining} seconds before requesting a new code.`,
        });
        return;
      }

      // Invalidate old challenge
      await prisma.oTPChallenge.update({
        where: { id: challenge.id },
        data: { usedAt: new Date() },
      });

      // Create new challenge
      const otpCode = generateOTP();
      const codeHash = await hashOTP(otpCode);
      const expiresAt = new Date(Date.now() + config.OTP_EXPIRES_IN_SECONDS * 1000);

      const newChallenge = await prisma.oTPChallenge.create({
        data: {
          userId: challenge.userId,
          codeHash,
          expiresAt,
          ipAddress,
          userAgent,
          attempts: 0,
        },
      });

      await emailService.sendOTP(
        challenge.user.email,
        challenge.user.fullName,
        otpCode,
        Math.round(config.OTP_EXPIRES_IN_SECONDS / 60)
      );

      await auditService.logAuthEvent({
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
    } catch (error: any) {
      logger.error('Error resending OTP', { error: error.message });
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
  async logout(req: Request, res: Response): Promise<void> {
    const ipAddress = this.getClientIp(req);
    const userAgent = this.getUserAgent(req);

    try {
      if (req.user && req.user.jti) {
        await prisma.sessionRevocation.create({
          data: {
            tokenJti: req.user.jti,
            userId: req.user.id,
            reason: 'User explicit logout',
          },
        });

        await auditService.logAuthEvent({
          userId: req.user.id,
          eventType: 'LOGOUT',
          success: true,
          ipAddress,
          userAgent,
        });

        await auditService.logEvent({
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
    } catch (error: any) {
      logger.error('Error during logout', { error: error.message });
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
  async me(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
        return;
      }

      const user = await prisma.user.findUnique({
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
    } catch (error: any) {
      logger.error('Error retrieving user profile in /me', { error: error.message });
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
  async bootstrapAdmin(req: Request, res: Response): Promise<void> {
    const { email, password, fullName, bootstrapSecret } = req.body;
    const ipAddress = this.getClientIp(req);
    const userAgent = this.getUserAgent(req);

    try {
      if (!config.ADMIN_BOOTSTRAP_SECRET || bootstrapSecret !== config.ADMIN_BOOTSTRAP_SECRET) {
        logger.warn('Failed admin bootstrap attempt - invalid bootstrap secret', { ip: ipAddress });
        res.status(403).json({
          success: false,
          error: 'Forbidden. Invalid administrator bootstrap secret.',
        });
        return;
      }

      const existingAdmin = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
      });

      if (existingAdmin) {
        res.status(400).json({
          success: false,
          error: 'System administrator already initialized. Bootstrap disabled.',
        });
        return;
      }

      const passwordHash = await hashPassword(password);

      const adminUser = await prisma.user.create({
        data: {
          email,
          passwordHash,
          fullName,
          role: 'ADMIN',
          isActive: true,
          emailVerified: true,
        },
      });

      await auditService.logEvent({
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
    } catch (error: any) {
      logger.error('Admin bootstrap error', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Failed to bootstrap administrator account.',
      });
    }
  }
}

export const authController = new AuthController();
