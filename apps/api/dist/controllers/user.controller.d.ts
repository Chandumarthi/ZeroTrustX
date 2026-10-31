import { Request, Response } from 'express';
export declare class UserController {
    /**
     * GET /api/user/profile
     * Return authenticated user's profile and registered devices
     */
    getProfile(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/user/activity
     * Return paginated list of authentication events for current user
     */
    getActivity(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/user/devices
     * Return recognized devices for the authenticated user
     */
    getDevices(req: Request, res: Response): Promise<void>;
    /**
     * DELETE /api/user/devices/:deviceId
     * Revoke trust for a specific device
     */
    revokeDevice(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/user/alerts
     * Return recent security alerts for the user (based on high-risk auth events)
     */
    getAlerts(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/user/risk-history
     * Return risk assessments for the user over recent days
     */
    getRiskHistory(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/user/latest-assessment
     * Return the most recent risk assessment for the user
     */
    getLatestAssessment(req: Request, res: Response): Promise<void>;
}
export declare const userController: UserController;
//# sourceMappingURL=user.controller.d.ts.map