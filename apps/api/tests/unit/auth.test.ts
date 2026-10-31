import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import {
  hashPassword,
  verifyPassword,
  generateOTP,
  hashOTP,
  verifyOTP,
  generateTokens,
  verifyAccessToken,
  generateJti,
} from '../../src/utils/crypto.utils';
import { config } from '../../src/config/env';

describe('Auth Crypto Utilities - Unit Tests', () => {
  describe('Password Hashing & Verification', () => {
    it('should securely hash password with bcrypt', async () => {
      const password = 'ZeroTrustPassw0rd!';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.startsWith('$2')).toBe(true);
    });

    it('should correctly verify valid password against hash', async () => {
      const password = 'CorrectPassword123#';
      const hash = await hashPassword(password);
      const isMatch = await verifyPassword(password, hash);

      expect(isMatch).toBe(true);
    });

    it('should reject invalid password against hash', async () => {
      const password = 'CorrectPassword123#';
      const hash = await hashPassword(password);
      const isMatch = await verifyPassword('WrongPassword999!', hash);

      expect(isMatch).toBe(false);
    });
  });

  describe('OTP Generation & Verification', () => {
    it('should generate a 6-digit numeric OTP', () => {
      const otp = generateOTP();

      expect(otp).toHaveLength(6);
      expect(/^\d{6}$/.test(otp)).toBe(true);
    });

    it('should generate unique OTPs across repeated calls', () => {
      const generated = new Set<string>();
      const iterations = 50;

      for (let i = 0; i < iterations; i++) {
        generated.add(generateOTP());
      }

      // With random 6-digit integers (100k - 999k), 50 distinct draws should have high uniqueness
      expect(generated.size).toBeGreaterThan(45);
    });

    it('should securely hash and verify OTP code', async () => {
      const otp = '849201';
      const hash = await hashOTP(otp);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(otp);

      const isValid = await verifyOTP(otp, hash);
      expect(isValid).toBe(true);
    });

    it('should reject invalid OTP against stored hash', async () => {
      const otp = '849201';
      const hash = await hashOTP(otp);

      const isValid = await verifyOTP('111222', hash);
      expect(isValid).toBe(false);
    });
  });

  describe('JWT Generation & Validation', () => {
    it('should generate access and refresh tokens with valid payload', () => {
      const userId = '11111111-2222-3333-4444-555555555555';
      const role = 'USER';
      const jti = generateJti();

      const tokens = generateTokens(userId, role, jti);

      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(tokens.jti).toBe(jti);

      const decoded = verifyAccessToken(tokens.accessToken);
      expect(decoded).not.toBeNull();
      expect(decoded?.id).toBe(userId);
      expect(decoded?.role).toBe(role);
      expect(decoded?.jti).toBe(jti);
    });

    it('should reject invalid or tampered JWT', () => {
      const tamperedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalidpayload.invalidsignature';
      const result = verifyAccessToken(tamperedToken);

      expect(result).toBeNull();
    });

    it('should reject expired JWT tokens', () => {
      const expiredToken = jwt.sign(
        { id: 'user-id', role: 'USER' },
        config.JWT_SECRET,
        {
          jwtid: 'expired-jti',
          expiresIn: '-5s', // expired 5 seconds ago
        }
      );

      const result = verifyAccessToken(expiredToken);
      expect(result).toBeNull();
    });

    it('should reject token signed with different secret', () => {
      const forgedToken = jwt.sign(
        { id: 'user-id', role: 'ADMIN' },
        'different_unauthorized_secret_key_12345',
        {
          jwtid: 'forged-jti',
          expiresIn: '1h',
        }
      );

      const result = verifyAccessToken(forgedToken);
      expect(result).toBeNull();
    });
  });
});
