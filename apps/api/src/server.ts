import { app } from './app';
import { config } from './config/env';
import { logger } from './config/logger';
import { connectDatabase, disconnectDatabase } from './config/database';

async function bootstrap() {
  try {
    logger.info('Initializing ZeroTrustX Adaptive Access API...');

    // Verify Database Connection
    await connectDatabase();

    // Start HTTP Server
    const server = app.listen(config.PORT, () => {
      logger.info(`=======================================================`);
      logger.info(` ZeroTrustX Security API listening on port: ${config.PORT}`);
      logger.info(` Environment: ${config.NODE_ENV}`);
      logger.info(` ML Service URL: ${config.ML_SERVICE_URL}`);
      logger.info(` Email Adapter: ${config.EMAIL_ADAPTER}`);
      logger.info(` Principle: NEVER TRUST, ALWAYS VERIFY`);
      logger.info(`=======================================================`);
    });

    // Graceful Shutdown Handler
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Commencing graceful system shutdown...`);
      server.close(async () => {
        logger.info('HTTP server closed.');
        await disconnectDatabase();
        logger.info('Graceful shutdown completed successfully. Exiting.');
        process.exit(0);
      });

      // Force shutdown after timeout if pending connections hang
      setTimeout(() => {
        logger.error('Forcefully terminating process due to shutdown timeout.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error: any) {
    logger.error('Fatal initialization error in server bootstrap', { error: error.message });
    process.exit(1);
  }
}

bootstrap();
