import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../config/logger';

export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const requestId = (req.headers['x-request-id'] as string) || uuidv4();

  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);

  // Hook into response finish event
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const { method, originalUrl } = req;
    const { statusCode } = res;
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';

    // Log with request ID context, omitting authorization headers/cookies
    logger.info(`${method} ${originalUrl} ${statusCode} ${duration}ms`, {
      requestId,
      method,
      url: originalUrl,
      status: statusCode,
      durationMs: duration,
      ip,
      userAgent: req.headers['user-agent'] || 'unknown',
    });
  });

  next();
}
