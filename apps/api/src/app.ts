import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { config } from './config/env';
import { logger } from './config/logger';
import { requestLoggerMiddleware } from './middleware/requestLogger.middleware';
import { generalRateLimiter } from './middleware/rateLimiter.middleware';

// Routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import riskRoutes from './routes/risk.routes';
import adminRoutes from './routes/admin.routes';
import healthRoutes from './routes/health.routes';

export function createApp(): Express {
  const app: Express = express();

  // 1. Core Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: config.NODE_ENV === 'production' ? undefined : false,
      crossOriginEmbedderPolicy: false,
    })
  );

  // 2. Cross-Origin Resource Sharing
  app.use(
    cors({
      origin: [config.CORS_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'x-csrf-token'],
    })
  );

  // 3. Body Parsing & Cookie Handling
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(cookieParser(config.COOKIE_SECRET));

  // 4. Request Logging & Correlation
  app.use(requestLoggerMiddleware);
  if (config.NODE_ENV !== 'test') {
    app.use(
      morgan(':method :url :status :res[content-length] - :response-time ms', {
        stream: {
          write: (message: string) => logger.debug(message.trim()),
        },
      })
    );
  }

  // 5. Global Rate Limiter
  app.use(generalRateLimiter);

  // 6. Mount Health Routes
  app.use('/health', healthRoutes);
  app.use('/api', healthRoutes); // for /api/health

  // 7. Mount Application API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/user', userRoutes);
  app.use('/api/risk', riskRoutes);
  app.use('/api/admin', adminRoutes);

  // 8. 404 Route Handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: `Endpoint not found: ${req.method} ${req.originalUrl}`,
    });
  });

  // 9. Global Error Handler
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Internal server error';

    logger.error('Unhandled API exception', {
      error: err.message,
      stack: config.NODE_ENV === 'production' ? undefined : err.stack,
      path: req.originalUrl,
      method: req.method,
      requestId: req.id,
    });

    res.status(status).json({
      success: false,
      error: config.NODE_ENV === 'production' && status === 500 ? 'An unexpected server error occurred.' : message,
      ...(config.NODE_ENV !== 'production' && { stack: err.stack }),
    });
  });

  return app;
}

export const app = createApp();
