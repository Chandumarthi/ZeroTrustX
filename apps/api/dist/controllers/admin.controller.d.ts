import { Request, Response } from 'express';
export declare class AdminController {
    /**
     * GET /api/admin/dashboard
     * Consolidated SOC security metrics and telemetry
     */
    getDashboard(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/admin/users
     * Paginated user directory with filtering and search
     */
    getUsers(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/admin/audit-logs
     * Query security audit trail with multi-field filtering
     */
    getAuditLogs(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/admin/risk-events
     * Paginated risk assessments with high/critical focus
     */
    getRiskEvents(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/admin/risk-policies
     * Return active risk policy definitions
     */
    getRiskPolicies(req: Request, res: Response): Promise<void>;
    /**
     * PUT /api/admin/risk-policies
     * Update active policy thresholds and feature weights with versioning and audit
     */
    updateRiskPolicy(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/admin/users/:userId
     * Get detailed profile for a specific user (admin only)
     */
    getUserDetails(req: Request, res: Response): Promise<void>;
    /**
     * PATCH /api/admin/users/:userId/status
     * Toggle user account active/inactive status (admin only)
     */
    updateUserStatus(req: Request, res: Response): Promise<void>;
    /**
     * PATCH /api/admin/users/:userId/role
     * Change user role (admin only)
     */
    updateUserRole(req: Request, res: Response): Promise<void>;
}
export declare const adminController: AdminController;
//# sourceMappingURL=admin.controller.d.ts.map