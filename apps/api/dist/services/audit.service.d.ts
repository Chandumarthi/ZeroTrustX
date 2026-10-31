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
export declare class AuditService {
    /**
     * Determine default severity for different security events
     */
    getSeverityForEvent(eventType: string): SeverityLevel;
    /**
     * Log an arbitrary security audit event
     */
    logEvent(params: AuditEventParams): Promise<void>;
    /**
     * Log an authentication lifecycle event
     */
    logAuthEvent(params: AuthEventParams): Promise<{
        success: boolean;
        accessDecision: import(".prisma/client").$Enums.AccessDecisionType | null;
        id: string;
        userId: string;
        userAgent: string;
        ipAddress: string;
        createdAt: Date;
        riskScore: import("@prisma/client/runtime/library").Decimal | null;
        riskLevel: import(".prisma/client").$Enums.RiskLevel | null;
        eventType: import(".prisma/client").$Enums.AuthEventType;
        failureReason: string | null;
        deviceId: string | null;
    } | null>;
}
export declare const auditService: AuditService;
//# sourceMappingURL=audit.service.d.ts.map