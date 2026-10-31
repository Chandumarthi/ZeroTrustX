"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const crypto_utils_1 = require("../utils/crypto.utils");
const database_1 = require("../config/database");
const logger_1 = require("../config/logger");
async function authMiddleware(req, res, next) {
    try {
        let token;
        // Check Authorization header
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7).trim();
        }
        // Fallback to cookie
        if (!token && req.cookies && req.cookies.accessToken) {
            token = req.cookies.accessToken;
        }
        if (!token) {
            res.status(401).json({
                success: false,
                error: 'Authentication required. No token provided.',
            });
            return;
        }
        const payload = (0, crypto_utils_1.verifyAccessToken)(token);
        if (!payload) {
            res.status(401).json({
                success: false,
                error: 'Invalid or expired access token.',
            });
            return;
        }
        // Check if token JTI has been revoked in database
        const revoked = await database_1.prisma.sessionRevocation.findUnique({
            where: { tokenJti: payload.jti },
        });
        if (revoked) {
            logger_1.logger.warn(`Rejected revoked token with JTI: ${payload.jti} for user ${payload.id}`);
            res.status(401).json({
                success: false,
                error: 'Token has been revoked. Please log in again.',
            });
            return;
        }
        // Check if user is still active in database
        const user = await database_1.prisma.user.findUnique({
            where: { id: payload.id },
            select: { id: true, email: true, role: true, isActive: true },
        });
        if (!user || !user.isActive) {
            res.status(401).json({
                success: false,
                error: 'User account is inactive or not found.',
            });
            return;
        }
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            jti: payload.jti,
        };
        next();
    }
    catch (error) {
        logger_1.logger.error('Unexpected error in auth middleware', { error });
        res.status(401).json({
            success: false,
            error: 'Authentication failed.',
        });
    }
}
//# sourceMappingURL=auth.middleware.js.map