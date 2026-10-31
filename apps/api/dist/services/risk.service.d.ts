import { RiskFeatures, RiskAssessmentResult, RiskLevel, AccessDecisionType } from '../types';
export declare class RiskService {
    /**
     * Calculate rule-based component of the risk score
     */
    calculateRuleScore(features: RiskFeatures): {
        score: number;
        breakdown: Record<string, number>;
    };
    /**
     * Determine risk level from numeric score
     */
    getRiskLevel(score: number): RiskLevel;
    /**
     * Determine access decision from numeric score and risk level
     */
    getAccessDecision(riskLevel: RiskLevel): AccessDecisionType;
    /**
     * Query Python ML risk service
     */
    private queryMLService;
    /**
     * Assess risk for a given authentication attempt
     */
    assessRisk(features: RiskFeatures, authEventId?: string | null, isOTPVerified?: boolean): Promise<RiskAssessmentResult>;
}
export declare const riskService: RiskService;
//# sourceMappingURL=risk.service.d.ts.map