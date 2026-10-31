import axios from 'axios';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { config } from '../config/env';
import { RiskFeatures, RiskAssessmentResult, RiskLevel, AccessDecisionType } from '../types';
import { policyService } from './policy.service';

export class RiskService {
  /**
   * Calculate rule-based component of the risk score
   */
  calculateRuleScore(features: RiskFeatures): { score: number; breakdown: Record<string, number> } {
    const breakdown: Record<string, number> = {};
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
  getRiskLevel(score: number): RiskLevel {
    if (score > 80) return 'CRITICAL';
    if (score >= 60) return 'HIGH';
    if (score >= 30) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Determine access decision from numeric score and risk level
   */
  getAccessDecision(riskLevel: RiskLevel): AccessDecisionType {
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
  private async queryMLService(features: RiskFeatures): Promise<{ probability: number; modelVersion: string } | null> {
    const isOffHours = features.loginHour >= 23 || features.loginHour < 5 ? 1 : 0;
    const failedToSuccessRatio =
      features.recentFailedAttempts > 0
        ? Math.min(1.0, features.recentFailedAttempts / (features.recentFailedAttempts + Math.max(1, features.loginFrequency * 30)))
        : 0.0;

    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.ML_SERVICE_SECRET}`,
      'X-API-Key': config.ML_SERVICE_SECRET,
      'X-Internal-API-Key': config.ML_SERVICE_SECRET,
      'X-Internal-Secret': config.ML_SERVICE_SECRET,
    };

    // 1. Try standard /api/assess endpoint
    try {
      const response = await axios.post(
        `${config.ML_SERVICE_URL}/api/assess`,
        {
          features: {
            device_known: features.deviceKnown ? 1 : 0,
            ip_known: features.ipKnown ? 1 : 0,
            recent_failed_attempts: features.recentFailedAttempts,
            login_hour: features.loginHour,
            time_since_last_login: features.timeSinceLastLogin,
            device_changed: features.deviceChanged ? 1 : 0,
            ip_changed: features.ipChanged ? 1 : 0,
            login_frequency: features.loginFrequency,
            is_off_hours: isOffHours,
            failed_to_success_ratio: failedToSuccessRatio,
          },
          otp_verified: false,
        },
        {
          headers: authHeaders,
          timeout: 2500,
        }
      );

      const mlProb =
        typeof response.data?.ml_probability === 'number'
          ? response.data.ml_probability
          : typeof response.data?.risk_probability === 'number'
          ? response.data.risk_probability
          : typeof response.data?.probability === 'number'
          ? response.data.probability
          : null;

      if (mlProb !== null) {
        return {
          probability: mlProb,
          modelVersion: response.data.model_version || '1.0.0',
        };
      }
    } catch (assessErr: any) {
      // If /api/assess fails, try /predict as backup
      try {
        const predictResponse = await axios.post(
          `${config.ML_SERVICE_URL}/predict`,
          {
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
          },
          {
            headers: authHeaders,
            timeout: 2500,
          }
        );

        if (predictResponse.data && typeof predictResponse.data.risk_probability === 'number') {
          return {
            probability: predictResponse.data.risk_probability,
            modelVersion: predictResponse.data.model_version || 'ml-v1.0.0',
          };
        }

        if (predictResponse.data && typeof predictResponse.data.probability === 'number') {
          return {
            probability: predictResponse.data.probability,
            modelVersion: predictResponse.data.model_version || 'ml-v1.0.0',
          };
        }
      } catch (predictErr: any) {
        logger.warn(`ML Risk Engine unreachable or returned error: ${assessErr.message}. Initiating graceful fallback.`);
        return null;
      }
    }

    return null;
  }

  /**
   * Assess risk for a given authentication attempt
   */
  async assessRisk(
    features: RiskFeatures,
    authEventId?: string | null,
    isOTPVerified: boolean = false
  ): Promise<RiskAssessmentResult> {
    const { score: ruleScore, breakdown } = this.calculateRuleScore(features);

    // Call Python ML service
    const mlResult = await this.queryMLService(features);

    let finalScore: number;
    let mlProbability: number;
    let modelVersion: string;
    let fallbackUsed = false;

    if (mlResult !== null) {
      mlProbability = mlResult.probability;
      modelVersion = mlResult.modelVersion;

      // Hybrid formula: ML probability (scaled 0-100) weight 40% + Rule score weight 60%
      const mlScaled = mlProbability * 100;
      const hybridScore = mlScaled * 0.4 + ruleScore * 0.6;
      finalScore = Math.min(100, Math.max(0, Math.round(hybridScore * 100) / 100));
    } else {
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
    const decision = policyService.evaluateAccess(finalScore, calculatedRiskLevel, isOTPVerified, true);

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
      savedAssessment = await prisma.riskAssessment.create({
        data: {
          userId: features.userId,
          authEventId: authEventId || null,
          riskScore: finalScore,
          riskLevel: calculatedRiskLevel as any,
          mlProbability,
          ruleBasedScore: ruleScore,
          accessDecision: decision as any,
          explanation: explanation as any,
          features: features as any,
          modelVersion,
        },
      });

      // Also record the access decision
      if (savedAssessment?.id) {
        await policyService.createAccessDecision({
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
    } catch (dbError) {
      logger.error('Failed to save RiskAssessment in database', { dbError });
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

export const riskService = new RiskService();
