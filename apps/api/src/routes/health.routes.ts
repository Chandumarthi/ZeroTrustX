import { Router, Request, Response } from 'express';
import axios from 'axios';
import { prisma } from '../config/database';
import { config } from '../config/env';
import { logger } from '../config/logger';

const router = Router();

/**
 * Basic liveness check endpoint
 */
router.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'ZeroTrustX Backend API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

/**
 * Comprehensive health readiness check verifying database and ML service
 */
router.get('/health', async (req: Request, res: Response) => {
  const healthStatus: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    services: {
      api: { status: 'up'; uptime: number };
      database: { status: 'up' | 'down'; latencyMs?: number; error?: string };
      mlEngine: { status: 'up' | 'down'; latencyMs?: number; url: string; error?: string };
    };
  } = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      api: {
        status: 'up',
        uptime: process.uptime(),
      },
      database: {
        status: 'down',
      },
      mlEngine: {
        status: 'down',
        url: config.ML_SERVICE_URL,
      },
    },
  };

  // Test Database Connectivity
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    healthStatus.services.database.status = 'up';
    healthStatus.services.database.latencyMs = Date.now() - dbStart;
  } catch (error: any) {
    healthStatus.services.database.status = 'down';
    healthStatus.services.database.error = error.message;
    healthStatus.status = 'unhealthy';
    logger.error('Health check database query failure', { error: error.message });
  }

  // Test ML Engine Connectivity
  const mlStart = Date.now();
  try {
    await axios.get(`${config.ML_SERVICE_URL}/health`, {
      timeout: 2000,
      headers: {
        'X-Internal-Secret': config.ML_SERVICE_SECRET,
      },
    });
    healthStatus.services.mlEngine.status = 'up';
    healthStatus.services.mlEngine.latencyMs = Date.now() - mlStart;
  } catch (error: any) {
    healthStatus.services.mlEngine.status = 'down';
    healthStatus.services.mlEngine.error = error.message;
    // If DB is up but ML is down, system runs in degraded mode (rule-based fallback)
    if (healthStatus.status !== 'unhealthy') {
      healthStatus.status = 'degraded';
    }
  }

  const httpStatusCode = healthStatus.status === 'unhealthy' ? 503 : 200;
  res.status(httpStatusCode).json(healthStatus);
});

export default router;
