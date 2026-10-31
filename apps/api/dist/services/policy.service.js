"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.policyService = exports.PolicyService = exports.DEFAULT_WEIGHTS = exports.DEFAULT_THRESHOLDS = void 0;
const database_1 = require("../config/database");
const logger_1 = require("../config/logger");
exports.DEFAULT_THRESHOLDS = {
    lowMax: 30,
    mediumMax: 60,
    highMax: 80,
};
exports.DEFAULT_WEIGHTS = {
    mlWeight: 0.4,
    unknownDevice: 15,
    unknownIp: 10,
    failedAttemptUnit: 8,
    failedAttemptMax: 40,
    offHoursLogin: 10,
    deviceChanged: 12,
    ipChanged: 5,
};
class PolicyService {
    /**
     * Fetch active risk policy from database or return hardcoded default
     */
    async getActivePolicy() {
        try {
            const policy = await database_1.prisma.riskPolicy.findFirst({
                where: { isActive: true },
                orderBy: { version: 'desc' },
            });
            if (policy) {
                return policy;
            }
        }
        catch (error) {
            logger_1.logger.warn('Failed to retrieve active policy from database, using built-in defaults', { error });
        }
        return {
            id: 'default-in-memory-policy',
            name: 'Default Zero-Trust Adaptive Policy',
            description: 'Standard adaptive policy with 4-tier risk classification',
            thresholds: exports.DEFAULT_THRESHOLDS,
            weights: exports.DEFAULT_WEIGHTS,
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
    evaluateAccess(riskScore, riskLevel, isOTPVerified = false, accountStatus = true) {
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
    async createAccessDecision(params) {
        try {
            return await database_1.prisma.accessDecision.create({
                data: {
                    userId: params.userId,
                    riskAssessmentId: params.riskAssessmentId,
                    decision: params.decision,
                    policyVersion: params.policyVersion || 1,
                    evidence: params.evidence,
                    explanation: params.explanation,
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to create AccessDecision record', { error, params });
            return null;
        }
    }
}
exports.PolicyService = PolicyService;
exports.policyService = new PolicyService();
//# sourceMappingURL=policy.service.js.map