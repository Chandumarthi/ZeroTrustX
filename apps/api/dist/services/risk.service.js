"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.riskService = exports.RiskService = void 0;
const axios_1 = __importDefault(require("axios"));
const database_1 = require("../config/database");
const logger_1 = require("../config/logger");
const env_1 = require("../config/env");
const policy_service_1 = require("./policy.service");
class RiskService {
    /**
     * Calculate rule-based component of the risk score
     */
    calculateRuleScore(features) {
        const breakdown = {};
        let score = 0;
        // Unknown device penalty (+15 pts)
        if (!features.deviceKnown) {
            breakdown.unknownDevice = 15;
            score += 15;
        }
        // Unknown IP address penalty (+10 pts)
        if (!features.ipKnown) {
            breakdown.unknownIp = 10;
            score += 10;
        }
        // Recent failed login attempts (+8 pts per attempt, capped at 40)
        if (features.recentFailedAttempts > 0) {
            const failedPts = Math.min(features.recentFailedAttempts * 8, 40);
            breakdown.recentFailedAttempts = failedPts;
            score += failedPts;
        }
        // Off-hours login between 11pm (23:00) and 5am (05:00) (+10 pts)
        if (features.loginHour >= 23 || features.loginHour < 5) {
            breakdown.offHoursLogin = 10;
            score += 10;
        }
        // Device change anomaly (+12 pts)
        if (features.deviceChanged) {
            breakdown.deviceChanged = 12;
            score += 12;
        }
        // IP change anomaly (+5 pts)
        if (features.ipChanged) {
            breakdown.ipChanged = 5;
            score += 5;
        }
        breakdown.totalRuleScore = score;
        return { score, breakdown };
    }
    /**
     * Determine risk level from numeric score
     */
    getRiskLevel(score) {
        if (score > 80)
            return 'CRITICAL';
        if (score >= 60)
            return 'HIGH';
        if (score >= 30)
            return 'MEDIUM';
        return 'LOW';
    }
    /**
     * Determine access decision from numeric score and risk level
     */
    getAccessDecision(riskLevel) {
        switch (riskLevel) {
            case 'CRITICAL':
                return 'BLOCK';
            case 'HIGH':
                return 'RESTRICT';
            case 'MEDIUM':
                return 'STEP_UP_VERIFICATION';
            case 'LOW':
            default:
                return 'ALLOW';
        }
    }
    /**
     * Query Python ML risk service
     */
    async queryMLService(features) {
        try {
            const response = await axios_1.default.post(`${env_1.config.ML_SERVICE_URL}/predict`, {
                user_id: features.userId,
                device_known: features.deviceKnown ? 1 : 0,
                ip_known: features.ipKnown ? 1 : 0,
                recent_failed_attempts: features.recentFailedAttempts,
                login_hour: features.loginHour,
                time_since_last_login: features.timeSinceLastLogin,
                device_changed: features.deviceChanged ? 1 : 0,
                login_frequency: features.loginFrequency,
                ip_changed: features.ipChanged ? 1 : 0,
                user_agent: features.userAgent,
                ip_address: features.ipAddress,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Internal-Secret': env_1.config.ML_SERVICE_SECRET,
                    'x-ml-api-key': env_1.config.ML_SERVICE_SECRET,
                },
                timeout: 2500, // Strict timeout to keep authentication responsive
            });
            if (response.data && typeof response.data.risk_probability === 'number') {
                return {
                    probability: response.data.risk_probability,
                    modelVersion: response.data.model_version || 'ml-v1.0.0',
                };
            }
            if (response.data && typeof response.data.probability === 'number') {
                return {
                    probability: response.data.probability,
                    modelVersion: response.data.model_version || 'ml-v1.0.0',
                };
            }
            return null;
        }
        catch (err) {
            logger_1.logger.warn(`ML Risk Engine unreachable or returned error: ${err.message}. Initiating graceful fallback.`);
            return null;
        }
    }
    /**
     * Assess risk for a given authentication attempt
     */
    async assessRisk(features, authEventId, isOTPVerified = false) {
        const { score: ruleScore, breakdown } = this.calculateRuleScore(features);
        // Call Python ML service
        const mlResult = await this.queryMLService(features);
        let finalScore;
        let mlProbability;
        let modelVersion;
        let fallbackUsed = false;
        if (mlResult !== null) {
            mlProbability = mlResult.probability;
            modelVersion = mlResult.modelVersion;
            // Hybrid formula: ML probability (scaled 0-100) weight 40% + Rule score weight 60%
            const mlScaled = mlProbability * 100;
            const hybridScore = mlScaled * 0.4 + ruleScore * 0.6;
            finalScore = Math.min(100, Math.max(0, Math.round(hybridScore * 100) / 100));
        }
        else {
            fallbackUsed = true;
            modelVersion = 'rule-based-fallback-v1.0';
            mlProbability = 0.5; // neutral fallback probability
            // CRITICAL ZERO-TRUST REQUIREMENT:
            // Failure to query ML service NEVER silently defaults to LOW risk.
            // Must enforce a minimum threshold of MEDIUM (30 pts).
            finalScore = Math.max(30, Math.min(100, ruleScore));
        }
        const calculatedRiskLevel = this.getRiskLevel(finalScore);
        // Determine access decision considering OTP status if applicable
        const decision = policy_service_1.policyService.evaluateAccess(finalScore, calculatedRiskLevel, isOTPVerified, true);
        const explanation = {
            ruleScore,
            ruleFactors: breakdown,
            mlProbability: Math.round(mlProbability * 10000) / 10000,
            mlContributionPct: mlResult ? 40 : 0,
            ruleContributionPct: mlResult ? 60 : 100,
            fallbackUsed,
            reasons: [
                features.recentFailedAttempts > 0 ? `${features.recentFailedAttempts} recent failed attempt(s)` : null,
                !features.deviceKnown ? 'Access from an unrecognized device' : null,
                !features.ipKnown ? 'Access from an unfamiliar IP address' : null,
                features.loginHour >= 23 || features.loginHour < 5 ? 'Login occurred during off-hours' : null,
                features.deviceChanged ? 'Device fingerprint mismatch' : null,
                features.ipChanged ? 'IP address location change' : null,
                fallbackUsed ? 'ML inference unavailable; applied fail-safe medium risk floor' : null,
            ].filter(Boolean),
        };
        // Persist assessment into database
        let savedAssessment;
        try {
            savedAssessment = await database_1.prisma.riskAssessment.create({
                data: {
                    userId: features.userId,
                    authEventId: authEventId || null,
                    riskScore: finalScore,
                    riskLevel: calculatedRiskLevel,
                    mlProbability,
                    ruleBasedScore: ruleScore,
                    accessDecision: decision,
                    explanation: explanation,
                    features: features,
                    modelVersion,
                },
            });
            // Also record the access decision
            await policy_service_1.policyService.createAccessDecision({
                userId: features.userId,
                riskAssessmentId: savedAssessment.id,
                decision,
                policyVersion: 1,
                evidence: {
                    riskScore: finalScore,
                    riskLevel: calculatedRiskLevel,
                    features,
                },
                explanation: `Decision: ${decision} based on risk score ${finalScore} (${calculatedRiskLevel})`,
            });
        }
        catch (dbError) {
            logger_1.logger.error('Failed to save RiskAssessment in database', { dbError });
        }
        return {
            riskScore: finalScore,
            riskLevel: calculatedRiskLevel,
            mlProbability,
            ruleBasedScore: ruleScore,
            accessDecision: decision,
            explanation,
            features,
            modelVersion,
            assessmentId: savedAssessment?.id,
        };
    }
}
exports.RiskService = RiskService;
exports.riskService = new RiskService();
//# sourceMappingURL=risk.service.js.map