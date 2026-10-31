import { Request, Response } from 'express';
export declare class RiskController {
    /**
     * POST /api/risk/assess
     * Real-time risk evaluation endpoint for contextual verification
     */
    assessRisk(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/risk/history
     * Retrieve authenticated user's risk assessment history with pagination
     */
    getRiskHistory(req: Request, res: Response): Promise<void>;
}
export declare const riskController: RiskController;
//# sourceMappingURL=risk.controller.d.ts.map