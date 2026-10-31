import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/crypto.utils';
import { prisma } from '../config/database';
import { logger } from '../config/logger';

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token: string | undefined;

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

    const payload = verifyAccessToken(token);
    if (!payload) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired access token.',
      });
      return;
    }

    // Check if token JTI has been revoked in database
    const revoked = await prisma.sessionRevocation.findUnique({
      where: { tokenJti: payload.jti },
    });

    if (revoked) {
      logger.warn(`Rejected revoked token with JTI: ${payload.jti} for user ${payload.id}`);
      res.status(401).json({
        success: false,
        error: 'Token has been revoked. Please log in again.',
      });
      return;
    }

    // Check if user is still active in database
    const user = await prisma.user.findUnique({
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
      role: user.role as any,
      jti: payload.jti,
    };

    next();
  } catch (error) {
    logger.error('Unexpected error in auth middleware', { error });
    res.status(401).json({
      success: false,
      error: 'Authentication failed.',
    });
  }
}
