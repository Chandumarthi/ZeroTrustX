"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.riskController = exports.RiskController = void 0;
const database_1 = require("../config/database");
const logger_1 = require("../config/logger");
const risk_service_1 = require("../services/risk.service");
const device_service_1 = require("../services/device.service");
class RiskController {
    /**
     * POST /api/risk/assess
     * Real-time risk evaluation endpoint for contextual verification
     */
    async assessRisk(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: 'Unauthorized' });
                return;
            }
            const ipAddress = req.headers['x-forwarded-for']?.split(',')[0].trim() ||
                req.socket.remoteAddress ||
                '127.0.0.1';
            const userAgent = req.headers['user-agent'] || 'Unknown-Client';
            const deviceFingerprint = device_service_1.deviceService.generateDeviceFingerprint(userAgent, ipAddress);
            const deviceKnown = await device_service_1.deviceService.isDeviceKnown(req.user.id, deviceFingerprint);
            const pastLoginWithIp = await database_1.prisma.authenticationEvent.findFirst({
                where: {
                    userId: req.user.id,
                    ipAddress,
                    success: true,
                },
            });
            const now = new Date();
            const customFeatures = req.body || {};
            const features = {
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
            const assessment = await risk_service_1.riskService.assessRisk(features, null, false);
            res.status(200).json({
                success: true,
                data: assessment,
            });
        }
        catch (error) {
            logger_1.logger.error('Error in manual risk assessment', { error: error.message });
            res.status(500).json({ success: false, error: 'Failed to complete risk assessment' });
        }
    }
    /**
     * GET /api/risk/history
     * Retrieve authenticated user's risk assessment history with pagination
     */
    async getRiskHistory(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: 'Unauthorized' });
                return;
            }
            const page = Math.max(1, parseInt(req.query.page, 10) || 1);
            const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
            const skip = (page - 1) * limit;
            const [total, assessments] = await Promise.all([
                database_1.prisma.riskAssessment.count({
                    where: { userId: req.user.id },
                }),
                database_1.prisma.riskAssessment.findMany({
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
        }
        catch (error) {
            logger_1.logger.error('Error fetching risk history', { error: error.message });
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }
}
exports.RiskController = RiskController;
exports.riskController = new RiskController();
//# sourceMappingURL=risk.controller.js.map