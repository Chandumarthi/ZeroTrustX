"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOTP = generateOTP;
exports.hashOTP = hashOTP;
exports.verifyOTP = verifyOTP;
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.generateJti = generateJti;
exports.generateTokens = generateTokens;
exports.verifyAccessToken = verifyAccessToken;
exports.verifyRefreshToken = verifyRefreshToken;
const crypto_1 = __importDefault(require("crypto"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const env_1 = require("../config/env");
const BCRYPT_ROUNDS = 12;
/**
 * Generate a cryptographically secure 6-digit numeric OTP
 */
function generateOTP() {
    const min = 100000;
    const max = 999999;
    const otpNumber = crypto_1.default.randomInt(min, max + 1);
    return otpNumber.toString();
}
/**
 * Hash an OTP using bcrypt
 */
async function hashOTP(otp) {
    const salt = await bcryptjs_1.default.genSalt(10);
    return bcryptjs_1.default.hash(otp, salt);
}
/**
 * Verify an OTP against a bcrypt hash
 */
async function verifyOTP(otp, hash) {
    try {
        return await bcryptjs_1.default.compare(otp, hash);
    }
    catch {
        return false;
    }
}
/**
 * Hash a user password using 12 bcrypt rounds
 */
async function hashPassword(password) {
    const salt = await bcryptjs_1.default.genSalt(BCRYPT_ROUNDS);
    return bcryptjs_1.default.hash(password, salt);
}
/**
 * Verify a plain text password against a stored bcrypt hash
 */
async function verifyPassword(password, hash) {
    try {
        return await bcryptjs_1.default.compare(password, hash);
    }
    catch {
        return false;
    }
}
/**
 * Generate a UUID v4 for JWT ID (jti)
 */
function generateJti() {
    return (0, uuid_1.v4)();
}
/**
 * Generate Access and Refresh JWT tokens
 */
function generateTokens(userId, role, jti = generateJti()) {
    const payload = {
        id: userId,
        email: '', // will be set or populated by caller if desired
        role,
    };
    const accessOptions = {
        jwtid: jti,
        expiresIn: env_1.config.JWT_EXPIRES_IN,
    };
    const refreshOptions = {
        jwtid: `${jti}-refresh`,
        expiresIn: env_1.config.JWT_REFRESH_EXPIRES_IN,
    };
    const accessToken = jsonwebtoken_1.default.sign(payload, env_1.config.JWT_SECRET, accessOptions);
    const refreshToken = jsonwebtoken_1.default.sign({ ...payload, isRefresh: true }, env_1.config.JWT_SECRET, refreshOptions);
    return {
        accessToken,
        refreshToken,
        jti,
    };
}
/**
 * Verify and decode an Access Token
 */
function verifyAccessToken(token) {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.config.JWT_SECRET);
        if (!decoded || !decoded.id || !decoded.role || !decoded.jti) {
            return null;
        }
        return {
            id: decoded.id,
            email: decoded.email || '',
            role: decoded.role,
            jti: decoded.jti,
            exp: decoded.exp,
            iat: decoded.iat,
        };
    }
    catch {
        return null;
    }
}
/**
 * Verify and decode a Refresh Token
 */
function verifyRefreshToken(token) {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.config.JWT_SECRET);
        if (!decoded || !decoded.id || !decoded.isRefresh) {
            return null;
        }
        return {
            id: decoded.id,
            email: decoded.email || '',
            role: decoded.role,
            jti: decoded.jti,
            isRefresh: true,
        };
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=crypto.utils.js.map