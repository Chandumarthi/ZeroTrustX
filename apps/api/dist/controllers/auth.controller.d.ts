import { Request, Response } from 'express';
export declare class AuthController {
    /**
     * Helper to extract client IP address accurately
     */
    private getClientIp;
    /**
     * Helper to extract User Agent
     */
    private getUserAgent;
    /**
     * POST /api/auth/register
     * Registers a new user account with strong password hashing
     */
    register(req: Request, res: Response): Promise<void>;
    /**
     * POST /api/auth/login
     * Adaptive risk-based login evaluation
     */
    login(req: Request, res: Response): Promise<void>;
    /**
     * POST /api/auth/verify-otp
     * Validates step-up OTP challenge and completes authentication
     */
    verifyOTP(req: Request, res: Response): Promise<void>;
    /**
     * POST /api/auth/resend-otp
     * Requests a new OTP for an active challenge with cooldown enforcement
     */
    resendOTP(req: Request, res: Response): Promise<void>;
    /**
     * POST /api/auth/logout
     * Explicit session revocation and cookie clearing
     */
    logout(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/auth/me
     * Return authenticated user profile details
     */
    me(req: Request, res: Response): Promise<void>;
    /**
     * POST /api/auth/bootstrap-admin
     * Safe initialization of initial system administrator
     */
    bootstrapAdmin(req: Request, res: Response): Promise<void>;
}
export declare const authController: AuthController;
//# sourceMappingURL=auth.controller.d.ts.map