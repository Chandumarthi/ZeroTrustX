import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../../src/app';
import { prisma } from '../../src/config/database';
import { config } from '../../src/config/env';
import { hashPassword, generateTokens } from '../../src/utils/crypto.utils';

// Mock Prisma Client
vi.mock('../../src/config/database', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    oTPChallenge: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    device: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    authenticationEvent: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    riskAssessment: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    accessDecision: {
      create: vi.fn(),
    },
    securityAuditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    sessionRevocation: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    riskPolicy: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
  },
  connectDatabase: vi.fn().mockResolvedValue(undefined),
  disconnectDatabase: vi.fn().mockResolvedValue(undefined),
}));

// Mock Email Service
vi.mock('../../src/services/email.service', () => ({
  emailService: {
    sendOTP: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock Axios for ML service communication
vi.mock('axios', () => ({
  default: {
    post: vi.fn().mockResolvedValue({
      data: {
        probability: 0.05,
        risk_probability: 0.05,
        model_version: 'v1.0.0-test',
      },
    }),
    get: vi.fn().mockResolvedValue({
      data: { status: 'healthy' },
    }),
  },
}));

describe('Auth & Access Control - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully with valid inputs', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);
      (prisma.user.create as any).mockResolvedValue({
        id: 'new-user-uuid-1234',
        email: 'alice@example.com',
        fullName: 'Alice Walker',
        role: 'USER',
        isActive: true,
      });
      (prisma.securityAuditLog.create as any).mockResolvedValue({});
      (prisma.authenticationEvent.create as any).mockResolvedValue({});

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'alice@example.com',
          password: 'SecurePassword123!',
          fullName: 'Alice Walker',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('alice@example.com');
      expect(prisma.user.create).toHaveBeenCalledTimes(1);
    });

    it('should return 409 conflict when email is already registered', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: 'existing-id',
        email: 'alice@example.com',
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'alice@example.com',
          password: 'SecurePassword123!',
          fullName: 'Alice Walker',
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already exists');
    });

    it('should return 400 when password does not meet complexity requirements', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'bob@example.com',
          password: 'weak',
          fullName: 'Bob Smith',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return 401 when user does not exist', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid email or password');
    });

    it('should return 401 when password is incorrect', async () => {
      const storedHash = await hashPassword('CorrectPassword123!');
      (prisma.user.findUnique as any).mockResolvedValue({
        id: 'user-id-1',
        email: 'user@example.com',
        passwordHash: storedHash,
        isActive: true,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@example.com',
          password: 'WrongPassword999!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should succeed and return access token when credentials match and risk is low', async () => {
      const storedHash = await hashPassword('CorrectPassword123!');
      const mockUser = {
        id: '11111111-2222-3333-4444-555555555555',
        email: 'charlie@example.com',
        fullName: 'Charlie Davis',
        passwordHash: storedHash,
        role: 'USER',
        isActive: true,
        emailVerified: true,
        devices: [],
        lastLoginAt: new Date(),
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      (prisma.user.update as any).mockResolvedValue(mockUser);
      (prisma.authenticationEvent.count as any).mockResolvedValue(0);
      (prisma.authenticationEvent.findFirst as any).mockResolvedValue({
        ipAddress: '127.0.0.1',
        deviceId: 'dev-1',
        success: true,
      });
      (prisma.authenticationEvent.create as any).mockResolvedValue({ id: 'auth-event-id' });
      (prisma.authenticationEvent.update as any).mockResolvedValue({});
      (prisma.device.findUnique as any).mockResolvedValue({ id: 'dev-1', isKnown: true });
      (prisma.device.update as any).mockResolvedValue({ id: 'dev-1' });
      (prisma.riskAssessment.create as any).mockResolvedValue({
        id: 'risk-1',
        riskScore: 10,
        riskLevel: 'LOW',
        accessDecision: 'ALLOW',
      });
      (prisma.accessDecision.create as any).mockResolvedValue({});

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'charlie@example.com',
          password: 'CorrectPassword123!',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.requiresOTP).toBe(false);
      expect(response.body.data.tokens.accessToken).toBeDefined();
    });
  });

  describe('Auth Middleware Security Tests', () => {
    it('should return 401 for unauthenticated request to protected endpoint', async () => {
      const response = await request(app).get('/api/user/profile');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Authentication required');
    });

    it('should return 401 when access token is expired', async () => {
      const expiredToken = jwt.sign(
        { id: 'user-1', email: 'test@example.com', role: 'USER' },
        config.JWT_SECRET,
        {
          jwtid: 'test-jti',
          expiresIn: '-10s',
        }
      );

      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid or expired');
    });

    it('should return 401 when token JTI has been revoked in database', async () => {
      const { accessToken, jti } = generateTokens('user-1', 'USER');

      (prisma.sessionRevocation.findUnique as any).mockResolvedValue({
        id: 'rev-1',
        tokenJti: jti,
        userId: 'user-1',
      });

      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Token has been revoked');
    });
  });

  describe('Admin Authorization Middleware Tests', () => {
    it('should return 403 Forbidden when regular USER attempts to access admin endpoint', async () => {
      const { accessToken } = generateTokens('regular-user-id', 'USER');

      (prisma.sessionRevocation.findUnique as any).mockResolvedValue(null);
      (prisma.user.findUnique as any).mockResolvedValue({
        id: 'regular-user-id',
        email: 'user@example.com',
        role: 'USER',
        isActive: true,
      });

      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Admin privileges required');
    });

    it('should allow access to admin endpoint when user role is ADMIN', async () => {
      const { accessToken } = generateTokens('admin-user-id', 'ADMIN');

      (prisma.sessionRevocation.findUnique as any).mockResolvedValue(null);
      (prisma.user.findUnique as any).mockResolvedValue({
        id: 'admin-user-id',
        email: 'admin@example.com',
        role: 'ADMIN',
        isActive: true,
      });

      (prisma.user.count as any).mockResolvedValue(5);
      (prisma.authenticationEvent.count as any).mockResolvedValue(2);
      (prisma.riskAssessment.count as any).mockResolvedValue(0);
      (prisma.authenticationEvent.findMany as any).mockResolvedValue([]);
      (prisma.riskAssessment.findMany as any).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.metrics).toBeDefined();
    });
  });
});
