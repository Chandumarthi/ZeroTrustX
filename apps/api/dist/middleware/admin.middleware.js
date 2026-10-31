"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminMiddleware = adminMiddleware;
const logger_1 = require("../config/logger");
const database_1 = require("../config/database");
async function adminMiddleware(req, res, next) {
    if (!req.user) {
        res.status(401).json({
            success: false,
            error: 'Authentication required prior to admin authorization.',
        });
        return;
    }
    if (req.user.role !== 'ADMIN') {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        logger_1.logger.warn('Unauthorized admin access attempt', {
            userId: req.user.id,
            email: req.user.email,
            role: req.user.role,
            path: req.originalUrl,
            ip,
        });
        // Record audit log entry for security monitoring
        try {
            await database_1.prisma.securityAuditLog.create({
                data: {
                    userId: req.user.id,
                    eventType: 'ADMIN_ACCESS_DENIED',
                    action: 'ACCESS_ADMIN_ENDPOINT',
                    resourceType: 'ADMIN_ROUTE',
                    resourceId: req.originalUrl,
                    ipAddress: ip,
                    userAgent: req.headers['user-agent'] || 'unknown',
                    severity: 'HIGH',
                    metadata: {
                        method: req.method,
                        userRole: req.user.role,
                    },
                },
            });
        }
        catch (auditError) {
            logger_1.logger.error('Failed to log unauthorized admin access audit', { auditError });
        }
        res.status(403).json({
            success: false,
            error: 'Forbidden. Admin privileges required.',
        });
        return;
    }
    next();
}
//# sourceMappingURL=admin.middleware.js.map