import { AccessDecisionType, RiskLevel } from '../types';
export interface DefaultPolicyThresholds {
    lowMax: number;
    mediumMax: number;
    highMax: number;
}
export interface DefaultPolicyWeights {
    mlWeight: number;
    unknownDevice: number;
    unknownIp: number;
    failedAttemptUnit: number;
    failedAttemptMax: number;
    offHoursLogin: number;
    deviceChanged: number;
    ipChanged: number;
}
export declare const DEFAULT_THRESHOLDS: DefaultPolicyThresholds;
export declare const DEFAULT_WEIGHTS: DefaultPolicyWeights;
export declare class PolicyService {
    /**
     * Fetch active risk policy from database or return hardcoded default
     */
    getActivePolicy(): Promise<{
        id: string;
        name: string;
        description: string;
        thresholds: import("@prisma/client/runtime/library").JsonValue;
        weights: import("@prisma/client/runtime/library").JsonValue;
        isActive: boolean;
        version: number;
        createdAt: Date;
        updatedAt: Date;
        updatedBy: string | null;
    } | {
        id: string;
        name: string;
        description: string;
        thresholds: DefaultPolicyThresholds;
        weights: DefaultPolicyWeights;
        isActive: boolean;
        version: number;
        createdAt: Date;
        updatedAt: Date;
        updatedBy: null;
    }>;
    /**
     * Determine the access decision based on calculated score, level, OTP status and account state
     */
    evaluateAccess(riskScore: number, riskLevel: RiskLevel, isOTPVerified?: boolean, accountStatus?: boolean): AccessDecisionType;
    /**
     * Record the final access decision in database
     */
    createAccessDecision(params: {
        userId: string;
        riskAssessmentId: string;
        decision: AccessDecisionType;
        policyVersion?: number;
        evidence: Record<string, any>;
        explanation: string;
    }): Promise<{
        id: string;
        userId: string;
        createdAt: Date;
        decision: import(".prisma/client").$Enums.AccessDecisionType;
        policyVersion: number;
        evidence: import("@prisma/client/runtime/library").JsonValue;
        explanation: string;
        riskAssessmentId: string;
    } | null>;
}
export declare const policyService: PolicyService;
//# sourceMappingURL=policy.service.d.ts.map