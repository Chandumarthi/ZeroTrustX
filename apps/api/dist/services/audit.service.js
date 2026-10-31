"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditService = exports.AuditService = void 0;
const database_1 = require("../config/database");
const logger_1 = require("../config/logger");
class AuditService {
    /**
     * Determine default severity for different security events
     */
    getSeverityForEvent(eventType) {
        const criticalEvents = ['ACCOUNT_TAKEOVER_ATTEMPT', 'CRITICAL_RISK_DETECTED', 'ADMIN_PRIVILEGE_ESCALATION'];
        const highEvents = ['LOGIN_BLOCKED', 'ACCESS_DENIED', 'ADMIN_ACCESS_DENIED', 'BRUTE_FORCE_DETECTED', 'HIGH_RISK_DETECTED'];
        const mediumEvents = ['LOGIN_FAILURE', 'OTP_FAILED', 'STEP_UP_REQUIRED', 'UNKNOWN_DEVICE_LOGIN', 'SESSION_REVOKED'];
        const lowEvents = ['OTP_REQUESTED', 'OTP_VERIFIED', 'PASSWORD_CHANGE'];
        if (criticalEvents.includes(eventType))
            return 'CRITICAL';
        if (highEvents.includes(eventType))
            return 'HIGH';
        if (mediumEvents.includes(eventType))
            return 'MEDIUM';
        if (lowEvents.includes(eventType))
            return 'LOW';
        return 'INFO';
    }
    /**
     * Log an arbitrary security audit event
     */
    async logEvent(params) {
        try {
            const severity = params.severity || this.getSeverityForEvent(params.eventType);
            await database_1.prisma.securityAuditLog.create({
                data: {
                    userId: params.userId || null,
                    eventType: params.eventType,
                    action: params.action,
                    resourceType: params.resourceType,
                    resourceId: params.resourceId || null,
                    ipAddress: params.ipAddress || 'unknown',
                    userAgent: params.userAgent || 'unknown',
                    metadata: params.metadata || {},
                    severity: severity,
                },
            });
        }
        catch (error) {
            // Audit failure must never crash the main application request pipeline
            logger_1.logger.error('Failed to write SecurityAuditLog', { error, params });
        }
    }
    /**
     * Log an authentication lifecycle event
     */
    async logAuthEvent(params) {
        try {
            return await database_1.prisma.authenticationEvent.create({
                data: {
                    userId: params.userId,
                    eventType: params.eventType,
                    success: params.success,
                    ipAddress: params.ipAddress || 'unknown',
                    userAgent: params.userAgent || 'unknown',
                    deviceId: params.deviceId || null,
                    riskScore: params.riskScore !== undefined && params.riskScore !== null ? params.riskScore : null,
                    riskLevel: params.riskLevel ? params.riskLevel : null,
                    accessDecision: params.accessDecision ? params.accessDecision : null,
                    failureReason: params.failureReason || null,
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to write AuthenticationEvent', { error, params });
            return null;
        }
    }
}
exports.AuditService = AuditService;
exports.auditService = new AuditService();
//# sourceMappingURL=audit.service.js.map