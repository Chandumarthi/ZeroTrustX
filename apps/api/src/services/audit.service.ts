import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { AuthEventType, SeverityLevel, RiskLevel, AccessDecisionType } from '../types';

export interface AuditEventParams {
  userId?: string | null;
  eventType: string;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  ipAddress: string;
  userAgent: string;
  metadata?: Record<string, any>;
  severity?: SeverityLevel;
}

export interface AuthEventParams {
  userId: string;
  eventType: AuthEventType;
  success: boolean;
  ipAddress: string;
  userAgent: string;
  deviceId?: string | null;
  riskScore?: number | null;
  riskLevel?: RiskLevel | null;
  accessDecision?: AccessDecisionType | null;
  failureReason?: string | null;
}

export class AuditService {
  /**
   * Determine default severity for different security events
   */
  getSeverityForEvent(eventType: string): SeverityLevel {
    const criticalEvents = ['ACCOUNT_TAKEOVER_ATTEMPT', 'CRITICAL_RISK_DETECTED', 'ADMIN_PRIVILEGE_ESCALATION'];
    const highEvents = ['LOGIN_BLOCKED', 'ACCESS_DENIED', 'ADMIN_ACCESS_DENIED', 'BRUTE_FORCE_DETECTED', 'HIGH_RISK_DETECTED'];
    const mediumEvents = ['LOGIN_FAILURE', 'OTP_FAILED', 'STEP_UP_REQUIRED', 'UNKNOWN_DEVICE_LOGIN', 'SESSION_REVOKED'];
    const lowEvents = ['OTP_REQUESTED', 'OTP_VERIFIED', 'PASSWORD_CHANGE'];

    if (criticalEvents.includes(eventType)) return 'CRITICAL';
    if (highEvents.includes(eventType)) return 'HIGH';
    if (mediumEvents.includes(eventType)) return 'MEDIUM';
    if (lowEvents.includes(eventType)) return 'LOW';
    return 'INFO';
  }

  /**
   * Log an arbitrary security audit event
   */
  async logEvent(params: AuditEventParams): Promise<void> {
    try {
      const severity = params.severity || this.getSeverityForEvent(params.eventType);

      await prisma.securityAuditLog.create({
        data: {
          userId: params.userId || null,
          eventType: params.eventType,
          action: params.action,
          resourceType: params.resourceType,
          resourceId: params.resourceId || null,
          ipAddress: params.ipAddress || 'unknown',
          userAgent: params.userAgent || 'unknown',
          metadata: params.metadata || {},
          severity: severity as any,
        },
      });
    } catch (error) {
      // Audit failure must never crash the main application request pipeline
      logger.error('Failed to write SecurityAuditLog', { error, params });
    }
  }

  /**
   * Log an authentication lifecycle event
   */
  async logAuthEvent(params: AuthEventParams) {
    try {
      return await prisma.authenticationEvent.create({
        data: {
          userId: params.userId,
          eventType: params.eventType as any,
          success: params.success,
          ipAddress: params.ipAddress || 'unknown',
          userAgent: params.userAgent || 'unknown',
          deviceId: params.deviceId || null,
          riskScore: params.riskScore !== undefined && params.riskScore !== null ? params.riskScore : null,
          riskLevel: params.riskLevel ? (params.riskLevel as any) : null,
          accessDecision: params.accessDecision ? (params.accessDecision as any) : null,
          failureReason: params.failureReason || null,
        },
      });
    } catch (error) {
      logger.error('Failed to write AuthenticationEvent', { error, params });
      return null;
    }
  }
}

export const auditService = new AuditService();
