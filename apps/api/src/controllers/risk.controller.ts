import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { riskService } from '../services/risk.service';
import { deviceService } from '../services/device.service';
import { RiskFeatures } from '../types';

export class RiskController {
  /**
   * POST /api/risk/assess
   * Real-time risk evaluation endpoint for contextual verification
   */
  async assessRisk(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const ipAddress =
        (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
        req.socket.remoteAddress ||
        '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Unknown-Client';
      const deviceFingerprint = deviceService.generateDeviceFingerprint(userAgent, ipAddress);

      const deviceKnown = await deviceService.isDeviceKnown(req.user.id, deviceFingerprint);

      const pastLoginWithIp = await prisma.authenticationEvent.findFirst({
        where: {
          userId: req.user.id,
          ipAddress,
          success: true,
        },
      });

      const now = new Date();

      const customFeatures = req.body || {};

      const features: RiskFeatures = {
        userId: req.user.id,
        deviceKnown: customFeatures.deviceKnown !== undefined ? Boolean(customFeatures.deviceKnown) : deviceKnown,
        ipKnown: customFeatures.ipKnown !== undefined ? Boolean(customFeatures.ipKnown) : !!pastLoginWithIp,
        recentFailedAttempts: typeof customFeatures.recentFailedAttempts === 'number' ? customFeatures.recentFailedAttempts : 0,
        loginHour: typeof customFeatures.loginHour === 'number' ? customFeatures.loginHour : now.getHours(),
        timeSinceLastLogin: typeof customFeatures.timeSinceLastLogin === 'number' ? customFeatures.timeSinceLastLogin : 0,
        deviceChanged: Boolean(customFeatures.deviceChanged),
        loginFrequency: typeof customFeatures.loginFrequency === 'number' ? customFeatures.loginFrequency : 1,
        ipChanged: Boolean(customFeatures.ipChanged),
        userAgent,
        ipAddress,
      };

      const assessment = await riskService.assessRisk(features, null, false);

      res.status(200).json({
        success: true,
        data: assessment,
      });
    } catch (error: any) {
      logger.error('Error in manual risk assessment', { error: error.message });
      res.status(500).json({ success: false, error: 'Failed to complete risk assessment' });
    }
  }

  /**
   * GET /api/risk/history
   * Retrieve authenticated user's risk assessment history with pagination
   */
  async getRiskHistory(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
      const skip = (page - 1) * limit;

      const [total, assessments] = await Promise.all([
        prisma.riskAssessment.count({
          where: { userId: req.user.id },
        }),
        prisma.riskAssessment.findMany({
          where: { userId: req.user.id },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
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
        }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          assessments,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error: any) {
      logger.error('Error fetching risk history', { error: error.message });
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
}

export const riskController = new RiskController();
