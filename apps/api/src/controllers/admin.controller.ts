import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { auditService } from '../services/audit.service';
import { DEFAULT_THRESHOLDS, DEFAULT_WEIGHTS } from '../services/policy.service';

export class AdminController {
  /**
   * GET /api/admin/dashboard
   * Consolidated SOC security metrics and telemetry
   */
  async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const [
        totalUsers,
        activeUsers,
        todaySuccessLogins,
        todayFailedLogins,
        suspiciousEventsCount,
        recentEvents,
        riskAssessmentsAll,
        authEvents7Days,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({
          where: { lastLoginAt: { gte: thirtyDaysAgo } },
        }),
        prisma.authenticationEvent.count({
          where: {
            eventType: 'LOGIN_SUCCESS',
            createdAt: { gte: startOfToday },
          },
        }),
        prisma.authenticationEvent.count({
          where: {
            eventType: 'LOGIN_FAILURE',
            createdAt: { gte: startOfToday },
          },
        }),
        prisma.riskAssessment.count({
          where: {
            riskLevel: { in: ['HIGH', 'CRITICAL'] },
          },
        }),
        prisma.authenticationEvent.findMany({
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { id: true, email: true, fullName: true },
            },
          },
        }),
        prisma.riskAssessment.findMany({
          select: { riskLevel: true, accessDecision: true },
        }),
        prisma.authenticationEvent.findMany({
          where: { createdAt: { gte: sevenDaysAgo } },
          select: { createdAt: true, success: true },
        }),
      ]);

      // Calculate risk level distribution
      const riskLevelDistribution: Record<string, number> = {
        LOW: 0,
        MEDIUM: 0,
        HIGH: 0,
        CRITICAL: 0,
      };

      const accessDecisionDistribution: Record<string, number> = {
        ALLOW: 0,
        STEP_UP_VERIFICATION: 0,
        RESTRICT: 0,
        BLOCK: 0,
      };

      for (const item of riskAssessmentsAll) {
        if (item.riskLevel && riskLevelDistribution[item.riskLevel] !== undefined) {
          riskLevelDistribution[item.riskLevel]++;
        }
        if (item.accessDecision && accessDecisionDistribution[item.accessDecision] !== undefined) {
          accessDecisionDistribution[item.accessDecision]++;
        }
      }

      // Group last 7 days authentication events by date
      const authEventsByDay: Record<string, { total: number; success: number; failed: number }> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayStr = d.toISOString().split('T')[0];
        authEventsByDay[dayStr] = { total: 0, success: 0, failed: 0 };
      }

      for (const event of authEvents7Days) {
        const dayStr = event.createdAt.toISOString().split('T')[0];
        if (authEventsByDay[dayStr]) {
          authEventsByDay[dayStr].total++;
          if (event.success) {
            authEventsByDay[dayStr].success++;
          } else {
            authEventsByDay[dayStr].failed++;
          }
        }
      }

      const eventsTrend = Object.entries(authEventsByDay).map(([date, stats]) => ({
        date,
        ...stats,
      }));

      res.status(200).json({
        success: true,
        data: {
          metrics: {
            totalUsers,
            activeUsers,
            todaySuccessLogins,
            todayFailedLogins,
            totalSuspiciousEvents: suspiciousEventsCount,
          },
          riskLevelDistribution,
          accessDecisionDistribution,
          eventsTrend,
          recentEvents,
        },
      });
    } catch (error: any) {
      logger.error('Error compiling admin dashboard telemetry', { error: error.message });
      res.status(500).json({ success: false, error: 'Internal server error compiling dashboard metrics' });
    }
  }

  /**
   * GET /api/admin/users
   * Paginated user directory with filtering and search
   */
  async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
      const skip = (page - 1) * limit;

      const search = (req.query.search as string)?.trim();
      const role = req.query.role as string;
      const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;

      const where: any = {};

      if (search) {
        where.OR = [
          { email: { contains: search, mode: 'insensitive' } },
          { fullName: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (role && (role === 'USER' || role === 'ADMIN')) {
        where.role = role;
      }

      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      const [total, users] = await Promise.all([
        prisma.user.count({ where }),
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            isActive: true,
            emailVerified: true,
            createdAt: true,
            lastLoginAt: true,
            _count: {
              select: {
                devices: true,
                authEvents: true,
              },
            },
          },
        }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          users,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error: any) {
      logger.error('Error fetching admin user list', { error: error.message });
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  /**
   * GET /api/admin/audit-logs
   * Query security audit trail with multi-field filtering
   */
  async getAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
      const skip = (page - 1) * limit;

      const { userId, eventType, severity, startDate, endDate } = req.query;

      const where: any = {};

      if (userId) {
        where.userId = String(userId);
      }

      if (eventType) {
        where.eventType = String(eventType);
      }

      if (severity) {
        where.severity = String(severity);
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(String(startDate));
        if (endDate) where.createdAt.lte = new Date(String(endDate));
      }

      const [total, logs] = await Promise.all([
        prisma.securityAuditLog.count({ where }),
        prisma.securityAuditLog.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { id: true, email: true, fullName: true },
            },
          },
        }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          logs,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error: any) {
      logger.error('Error fetching security audit logs', { error: error.message });
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  /**
   * GET /api/admin/risk-events
   * Paginated risk assessments with high/critical focus
   */
  async getRiskEvents(req: Request, res: Response): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
      const skip = (page - 1) * limit;

      const filterHighCritical = req.query.highOnly === 'true';
      const riskLevel = req.query.riskLevel as string;

      const where: any = {};

      if (riskLevel) {
        where.riskLevel = riskLevel;
      } else if (filterHighCritical) {
        where.riskLevel = { in: ['HIGH', 'CRITICAL'] };
      }

      const [total, events] = await Promise.all([
        prisma.riskAssessment.count({ where }),
        prisma.riskAssessment.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { id: true, email: true, fullName: true },
            },
          },
        }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          events,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error: any) {
      logger.error('Error fetching risk events', { error: error.message });
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  /**
   * GET /api/admin/risk-policies
   * Return active risk policy definitions
   */
  async getRiskPolicies(req: Request, res: Response): Promise<void> {
    try {
      const policies = await prisma.riskPolicy.findMany({
        orderBy: { version: 'desc' },
      });

      if (policies.length === 0) {
        // Return default built-in policy specification
        res.status(200).json({
          success: true,
          data: [
            {
              id: 'system-default',
              name: 'Default Zero-Trust Adaptive Policy',
              description: 'Autonomous risk scoring combining ML predictions with behavioral anomalies',
              thresholds: DEFAULT_THRESHOLDS,
              weights: DEFAULT_WEIGHTS,
              isActive: true,
              version: 1,
            },
          ],
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: policies,
      });
    } catch (error: any) {
      logger.error('Error fetching risk policies', { error: error.message });
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  /**
   * PUT /api/admin/risk-policies
   * Update active policy thresholds and feature weights with versioning and audit
   */
  async updateRiskPolicy(req: Request, res: Response): Promise<void> {
    try {
      const { name, description, thresholds, weights, isActive } = req.body;
      const adminId = req.user?.id;
      const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';

      const currentPolicy = await prisma.riskPolicy.findFirst({
        where: { isActive: true },
        orderBy: { version: 'desc' },
      });

      const nextVersion = (currentPolicy?.version || 1) + 1;

      // Deactivate older policies if new one is active
      if (isActive !== false) {
        await prisma.riskPolicy.updateMany({
          where: { isActive: true },
          data: { isActive: false },
        });
      }

      const updatedPolicy = await prisma.riskPolicy.create({
        data: {
          name: name || currentPolicy?.name || 'ZeroTrustX Adaptive Policy',
          description: description || currentPolicy?.description || 'Updated adaptive risk scoring policy',
          thresholds: thresholds || currentPolicy?.thresholds || DEFAULT_THRESHOLDS,
          weights: weights || currentPolicy?.weights || DEFAULT_WEIGHTS,
          isActive: isActive !== undefined ? isActive : true,
          version: nextVersion,
          updatedBy: adminId || null,
        },
      });

      // Security audit log for policy change
      await auditService.logEvent({
        userId: adminId,
        eventType: 'RISK_POLICY_UPDATED',
        action: 'UPDATE_POLICY',
        resourceType: 'POLICY',
        resourceId: updatedPolicy.id,
        ipAddress: ip,
        userAgent: req.headers['user-agent'] || 'unknown',
        severity: 'HIGH',
        metadata: {
          previousVersion: currentPolicy?.version || 0,
          newVersion: nextVersion,
          thresholds: updatedPolicy.thresholds,
          weights: updatedPolicy.weights,
        },
      });

      res.status(200).json({
        success: true,
        message: `Risk policy updated to version ${nextVersion}`,
        data: updatedPolicy,
      });
    } catch (error: any) {
      logger.error('Error updating risk policy', { error: error.message });
      res.status(500).json({ success: false, error: 'Internal server error updating policy' });
    }
  }
  /**
   * GET /api/admin/users/:userId
   * Get detailed profile for a specific user (admin only)
   */
  async getUserDetails(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      const user = await prisma.user.findUnique({
        where: { id: userId },
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
          devices: {
            select: { id: true, deviceFingerprint: true, userAgent: true, ipAddress: true, isKnown: true, lastSeenAt: true, firstSeenAt: true, loginCount: true },
            orderBy: { lastSeenAt: 'desc' },
            take: 5,
          },
          riskAssessments: {
            select: { id: true, riskScore: true, riskLevel: true, mlProbability: true, accessDecision: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
          _count: {
            select: { authEvents: true, devices: true },
          },
        },
      });

      if (!user) {
        res.status(404).json({ success: false, error: 'User not found.' });
        return;
      }

      const [totalLogins, failedLogins] = await Promise.all([
        prisma.authenticationEvent.count({ where: { userId, success: true } }),
        prisma.authenticationEvent.count({ where: { userId, success: false } }),
      ]);

      const mapped = {
        ...user,
        riskAssessments: user.riskAssessments.map((r: any) => ({
          ...r,
          riskScore: Number(r.riskScore),
          mlProbability: Number(r.mlProbability),
        })),
        devices: user.devices.map((d: any) => {
          const ua = d.userAgent || '';
          const browserMatch = ua.match(/(?:Chrome|Firefox|Safari|Edge|OPR|Opera)\/[\d.]+/);
          const browser = browserMatch ? browserMatch[0].split('/')[0] : 'Unknown';
          const isMobile = /Mobile|Android|iPhone|iPad/.test(ua);
          return {
            id: d.id,
            deviceId: d.deviceFingerprint,
            deviceName: isMobile ? `Mobile – ${browser}` : `Desktop – ${browser}`,
            browser,
            os: 'Unknown',
            ip: d.ipAddress,
            isTrusted: d.isKnown,
            lastSeenAt: d.lastSeenAt,
            createdAt: d.firstSeenAt,
          };
        }),
      };

      res.status(200).json({
        success: true,
        data: {
          user: mapped,
          recognizedDevices: mapped.devices,
          recentAssessments: mapped.riskAssessments,
          stats: {
            totalLogins,
            failedLogins,
            lastRiskScore: mapped.riskAssessments[0]?.riskScore ?? 0,
            accountAgeDays: Math.ceil((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
          },
        },
      });
    } catch (error: any) {
      logger.error('Error fetching user details', { error: error.message });
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  /**
   * PATCH /api/admin/users/:userId/status
   * Toggle user account active/inactive status (admin only)
   */
  async updateUserStatus(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { status } = req.body;
      const adminId = req.user?.id;
      const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';

      if (!['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status)) {
        res.status(400).json({ success: false, error: 'Invalid status value. Use ACTIVE, INACTIVE, or SUSPENDED.' });
        return;
      }

      const targetUser = await prisma.user.findUnique({ where: { id: userId } });
      if (!targetUser) {
        res.status(404).json({ success: false, error: 'User not found.' });
        return;
      }

      // Prevent admin from deactivating themselves
      if (userId === adminId) {
        res.status(400).json({ success: false, error: 'Administrators cannot modify their own account status.' });
        return;
      }

      const isActive = status === 'ACTIVE';
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { isActive },
        select: { id: true, email: true, fullName: true, role: true, isActive: true, createdAt: true },
      });

      await auditService.logEvent({
        userId: adminId,
        eventType: 'ADMIN_USER_STATUS_CHANGE',
        action: 'UPDATE_USER_STATUS',
        resourceType: 'USER',
        resourceId: userId,
        ipAddress: ip,
        userAgent: req.headers['user-agent'] || 'unknown',
        severity: 'HIGH',
        metadata: { previousStatus: targetUser.isActive ? 'ACTIVE' : 'INACTIVE', newStatus: status },
      });

      res.status(200).json({ success: true, data: updatedUser, message: `User account status updated to ${status}.` });
    } catch (error: any) {
      logger.error('Error updating user status', { error: error.message });
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  /**
   * PATCH /api/admin/users/:userId/role
   * Change user role (admin only)
   */
  async updateUserRole(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { role } = req.body;
      const adminId = req.user?.id;
      const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';

      if (!['USER', 'ADMIN'].includes(role)) {
        res.status(400).json({ success: false, error: 'Invalid role. Use USER or ADMIN.' });
        return;
      }

      if (userId === adminId) {
        res.status(400).json({ success: false, error: 'Administrators cannot modify their own role.' });
        return;
      }

      const targetUser = await prisma.user.findUnique({ where: { id: userId } });
      if (!targetUser) {
        res.status(404).json({ success: false, error: 'User not found.' });
        return;
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { role: role as any },
        select: { id: true, email: true, fullName: true, role: true, isActive: true },
      });

      await auditService.logEvent({
        userId: adminId,
        eventType: 'ADMIN_ROLE_CHANGE',
        action: 'UPDATE_USER_ROLE',
        resourceType: 'USER',
        resourceId: userId,
        ipAddress: ip,
        userAgent: req.headers['user-agent'] || 'unknown',
        severity: 'CRITICAL',
        metadata: { previousRole: targetUser.role, newRole: role },
      });

      res.status(200).json({ success: true, data: updatedUser, message: `User role updated to ${role}.` });
    } catch (error: any) {
      logger.error('Error updating user role', { error: error.message });
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

}

export const adminController = new AdminController();
