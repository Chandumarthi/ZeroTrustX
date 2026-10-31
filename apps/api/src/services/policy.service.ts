import { prisma } from '../config/database';
import { logger } from '../config/logger';
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

export const DEFAULT_THRESHOLDS: DefaultPolicyThresholds = {
  lowMax: 30,
  mediumMax: 60,
  highMax: 80,
};

export const DEFAULT_WEIGHTS: DefaultPolicyWeights = {
  mlWeight: 0.4,
  unknownDevice: 15,
  unknownIp: 10,
  failedAttemptUnit: 8,
  failedAttemptMax: 40,
  offHoursLogin: 10,
  deviceChanged: 12,
  ipChanged: 5,
};

export class PolicyService {
  /**
   * Fetch active risk policy from database or return hardcoded default
   */
  async getActivePolicy() {
    try {
      const policy = await prisma.riskPolicy.findFirst({
        where: { isActive: true },
        orderBy: { version: 'desc' },
      });

      if (policy) {
        return policy;
      }
    } catch (error) {
      logger.warn('Failed to retrieve active policy from database, using built-in defaults', { error });
    }

    return {
      id: 'default-in-memory-policy',
      name: 'Default Zero-Trust Adaptive Policy',
      description: 'Standard adaptive policy with 4-tier risk classification',
      thresholds: DEFAULT_THRESHOLDS,
      weights: DEFAULT_WEIGHTS,
      isActive: true,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedBy: null,
    };
  }

  /**
   * Determine the access decision based on calculated score, level, OTP status and account state
   */
  evaluateAccess(
    riskScore: number,
    riskLevel: RiskLevel,
    isOTPVerified: boolean = false,
    accountStatus: boolean = true
  ): AccessDecisionType {
    // Inactive or disabled accounts are unconditionally blocked
    if (!accountStatus) {
      return 'BLOCK';
    }

    // Critical risks are always blocked regardless of OTP
    if (riskLevel === 'CRITICAL' || riskScore > 80) {
      return 'BLOCK';
    }

    // High risks lead to restricted access
    if (riskLevel === 'HIGH' || (riskScore > 60 && riskScore <= 80)) {
      return 'RESTRICT';
    }

    // Medium risks require step-up verification (OTP)
    if (riskLevel === 'MEDIUM' || (riskScore >= 30 && riskScore <= 60)) {
      if (isOTPVerified) {
        return 'ALLOW';
      }
      return 'STEP_UP_VERIFICATION';
    }

    // Low risks (< 30) are permitted directly
    return 'ALLOW';
  }

  /**
   * Record the final access decision in database
   */
  async createAccessDecision(params: {
    userId: string;
    riskAssessmentId: string;
    decision: AccessDecisionType;
    policyVersion?: number;
    evidence: Record<string, any>;
    explanation: string;
  }) {
    try {
      return await prisma.accessDecision.create({
        data: {
          userId: params.userId,
          riskAssessmentId: params.riskAssessmentId,
          decision: params.decision as any,
          policyVersion: params.policyVersion || 1,
          evidence: params.evidence,
          explanation: params.explanation,
        },
      });
    } catch (error) {
      logger.error('Failed to create AccessDecision record', { error, params });
      return null;
    }
  }
}

export const policyService = new PolicyService();
