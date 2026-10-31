import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { logger } from '../config/logger';

export class UserController {
  /**
   * GET /api/user/profile
   * Return authenticated user's profile and registered devices
   */
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
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
          devices: {
            select: {
              id: true,
              deviceFingerprint: true,
              userAgent: true,
              ipAddress: true,
              isKnown: true,
              firstSeenAt: true,
              lastSeenAt: true,
              loginCount: true,
            },
            orderBy: { lastSeenAt: 'desc' },
          },
        },
      });

      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error: any) {
      logger.error('Error fetching user profile', { error: error.message });
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  /**
   * GET /api/user/activity
   * Return paginated list of authentication events for current user
   */
  async getActivity(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
      const skip = (page - 1) * limit;

      const [total, events] = await Promise.all([
        prisma.authenticationEvent.count({
          where: { userId: req.user.id },
        }),
        prisma.authenticationEvent.findMany({
          where: { userId: req.user.id },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          select: {
            id: true,
            eventType: true,
            success: true,
            ipAddress: true,
            userAgent: true,
            riskScore: true,
            riskLevel: true,
            accessDecision: true,
            failureReason: true,
            createdAt: true,
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
      logger.error('Error fetching user activity', { error: error.message });
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  /**
   * GET /api/user/devices
   * Return recognized devices for the authenticated user
   */
  async getDevices(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const devices = await prisma.device.findMany({
        where: { userId: req.user.id },
        orderBy: { lastSeenAt: 'desc' },
      });

      const mapped = devices.map((d: any) => {
        const ua = d.userAgent || '';
        const browserMatch = ua.match(/(?:Chrome|Firefox|Safari|Edge|OPR|Opera)\/[\d.]+/);
        const browser = browserMatch ? browserMatch[0].split('/')[0] : 'Unknown Browser';
        const osMatch = ua.match(/\(([^)]+)\)/);
        const os = osMatch ? osMatch[1].split(';')[0].trim() : 'Unknown OS';
        const isMobile = /Mobile|Android|iPhone|iPad/.test(ua);

        return {
          id: d.id,
          userId: d.userId,
          deviceId: d.deviceFingerprint,
          deviceName: isMobile ? `Mobile – ${browser}` : `Desktop – ${browser}`,
          browser,
          os,
          ip: d.ipAddress,
          isTrusted: d.isKnown,
          lastSeenAt: d.lastSeenAt,
          createdAt: d.firstSeenAt,
        };
      });

      res.status(200).json({ success: true, data: mapped });
    } catch (error: any) {
      logger.error('Error fetching user devices', { error: error.message });
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  /**
   * DELETE /api/user/devices/:deviceId
   * Revoke trust for a specific device
   */
  async revokeDevice(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { deviceId } = req.params;

      const device = await prisma.device.findFirst({
        where: { id: deviceId, userId: req.user.id },
      });

      if (!device) {
        res.status(404).json({ success: false, error: 'Device not found or not owned by current user.' });
        return;
      }

      await prisma.device.delete({ where: { id: deviceId } });

      res.status(200).json({ success: true, message: 'Device trust revoked successfully.' });
    } catch (error: any) {
      logger.error('Error revoking device', { error: error.message });
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  /**
   * GET /api/user/alerts
   * Return recent security alerts for the user (based on high-risk auth events)
   */
  async getAlerts(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const events = await prisma.authenticationEvent.findMany({
        where: {
          userId: req.user.id,
          createdAt: { gte: last24h },
          OR: [
            { eventType: 'LOGIN_FAILURE' },
            { eventType: 'ACCESS_DENIED' },
            { eventType: 'OTP_FAILED' },
            { riskLevel: { in: ['HIGH', 'CRITICAL'] } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      const alerts = events.map((e: any) => ({
        id: e.id,
        title: e.eventType.replace(/_/g, ' '),
        message: e.failureReason || `Security event: ${e.eventType} from ${e.ipAddress}`,
        severity: e.riskLevel === 'CRITICAL' ? 'CRITICAL' : e.riskLevel === 'HIGH' ? 'ERROR' : 'WARNING',
        timestamp: e.createdAt,
        read: false,
      }));

      res.status(200).json({ success: true, data: alerts });
    } catch (error: any) {
      logger.error('Error fetching user alerts', { error: error.message });
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  /**
   * GET /api/user/risk-history
   * Return risk assessments for the user over recent days
   */
  async getRiskHistory(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const days = Math.min(90, Math.max(1, parseInt(req.query.days as string, 10) || 14));
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const assessments = await prisma.riskAssessment.findMany({
        where: { userId: req.user.id, createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          riskScore: true,
          riskLevel: true,
          mlProbability: true,
          ruleBasedScore: true,
          accessDecision: true,
          explanation: true,
          modelVersion: true,
          createdAt: true,
        },
      });

      const mapped = assessments.map((a: any) => ({
        ...a,
        riskScore: Number(a.riskScore),
        mlProbability: Number(a.mlProbability),
        decision: a.accessDecision,
        explanation: typeof a.explanation === 'object' && a.explanation !== null
          ? (a.explanation as any).reasons?.join('. ') || 'Risk evaluated successfully.'
          : String(a.explanation),
      }));

      res.status(200).json({ success: true, data: mapped });
    } catch (error: any) {
      logger.error('Error fetching risk history', { error: error.message });
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  /**
   * GET /api/user/latest-assessment
   * Return the most recent risk assessment for the user
   */
  async getLatestAssessment(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const assessment = await prisma.riskAssessment.findFirst({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
      });

      if (!assessment) {
        res.status(404).json({ success: false, error: 'No risk assessment found.' });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          ...assessment,
          riskScore: Number(assessment.riskScore),
          mlProbability: Number(assessment.mlProbability),
          decision: assessment.accessDecision,
        },
      });
    } catch (error: any) {
      logger.error('Error fetching latest assessment', { error: error.message });
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
}

export const userController = new UserController();
