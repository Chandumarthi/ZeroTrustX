import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/env';
import { UserPayload, Role } from '../types';

const BCRYPT_ROUNDS = 12;

/**
 * Generate a cryptographically secure 6-digit numeric OTP
 */
export function generateOTP(): string {
  const min = 100000;
  const max = 999999;
  const otpNumber = crypto.randomInt(min, max + 1);
  return otpNumber.toString();
}

/**
 * Hash an OTP using bcrypt
 */
export async function hashOTP(otp: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(otp, salt);
}

/**
 * Verify an OTP against a bcrypt hash
 */
export async function verifyOTP(otp: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(otp, hash);
  } catch {
    return false;
  }
}

/**
 * Hash a user password using 12 bcrypt rounds
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
  return bcrypt.hash(password, salt);
}

/**
 * Verify a plain text password against a stored bcrypt hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

/**
 * Generate a UUID v4 for JWT ID (jti)
 */
export function generateJti(): string {
  return uuidv4();
}

/**
 * Generate Access and Refresh JWT tokens
 */
export function generateTokens(
  userId: string,
  role: Role,
  jti: string = generateJti()
): { accessToken: string; refreshToken: string; jti: string } {
  const payload: Omit<UserPayload, 'jti'> = {
    id: userId,
    email: '', // will be set or populated by caller if desired
    role,
  };

  const accessOptions: SignOptions = {
    jwtid: jti,
    expiresIn: config.JWT_EXPIRES_IN as any,
  };

  const refreshOptions: SignOptions = {
    jwtid: `${jti}-refresh`,
    expiresIn: config.JWT_REFRESH_EXPIRES_IN as any,
  };

  const accessToken = jwt.sign(payload, config.JWT_SECRET, accessOptions);
  const refreshToken = jwt.sign({ ...payload, isRefresh: true }, config.JWT_SECRET, refreshOptions);

  return {
    accessToken,
    refreshToken,
    jti,
  };
}

/**
 * Verify and decode an Access Token
 */
export function verifyAccessToken(token: string): (UserPayload & { exp?: number; iat?: number }) | null {
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as any;
    if (!decoded || !decoded.id || !decoded.role || !decoded.jti) {
      return null;
    }
    return {
      id: decoded.id,
      email: decoded.email || '',
      role: decoded.role as Role,
      jti: decoded.jti,
      exp: decoded.exp,
      iat: decoded.iat,
    };
  } catch {
    return null;
  }
}

/**
 * Verify and decode a Refresh Token
 */
export function verifyRefreshToken(token: string): (UserPayload & { isRefresh: boolean }) | null {
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as any;
    if (!decoded || !decoded.id || !decoded.isRefresh) {
      return null;
    }
    return {
      id: decoded.id,
      email: decoded.email || '',
      role: decoded.role as Role,
      jti: decoded.jti,
      isRefresh: true,
    };
  } catch {
    return null;
  }
}
