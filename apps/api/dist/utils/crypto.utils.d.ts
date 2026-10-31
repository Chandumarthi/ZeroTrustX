import { UserPayload, Role } from '../types';
/**
 * Generate a cryptographically secure 6-digit numeric OTP
 */
export declare function generateOTP(): string;
/**
 * Hash an OTP using bcrypt
 */
export declare function hashOTP(otp: string): Promise<string>;
/**
 * Verify an OTP against a bcrypt hash
 */
export declare function verifyOTP(otp: string, hash: string): Promise<boolean>;
/**
 * Hash a user password using 12 bcrypt rounds
 */
export declare function hashPassword(password: string): Promise<string>;
/**
 * Verify a plain text password against a stored bcrypt hash
 */
export declare function verifyPassword(password: string, hash: string): Promise<boolean>;
/**
 * Generate a UUID v4 for JWT ID (jti)
 */
export declare function generateJti(): string;
/**
 * Generate Access and Refresh JWT tokens
 */
export declare function generateTokens(userId: string, role: Role, jti?: string): {
    accessToken: string;
    refreshToken: string;
    jti: string;
};
/**
 * Verify and decode an Access Token
 */
export declare function verifyAccessToken(token: string): (UserPayload & {
    exp?: number;
    iat?: number;
}) | null;
/**
 * Verify and decode a Refresh Token
 */
export declare function verifyRefreshToken(token: string): (UserPayload & {
    isRefresh: boolean;
}) | null;
//# sourceMappingURL=crypto.utils.d.ts.map