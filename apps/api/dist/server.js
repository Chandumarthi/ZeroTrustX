"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_1 = require("./config/env");
const logger_1 = require("./config/logger");
const database_1 = require("./config/database");
async function bootstrap() {
    try {
        logger_1.logger.info('Initializing ZeroTrustX Adaptive Access API...');
        // Verify Database Connection
        await (0, database_1.connectDatabase)();
        // Start HTTP Server
        const server = app_1.app.listen(env_1.config.PORT, () => {
            logger_1.logger.info(`=======================================================`);
            logger_1.logger.info(` ZeroTrustX Security API listening on port: ${env_1.config.PORT}`);
            logger_1.logger.info(` Environment: ${env_1.config.NODE_ENV}`);
            logger_1.logger.info(` ML Service URL: ${env_1.config.ML_SERVICE_URL}`);
            logger_1.logger.info(` Email Adapter: ${env_1.config.EMAIL_ADAPTER}`);
            logger_1.logger.info(` Principle: NEVER TRUST, ALWAYS VERIFY`);
            logger_1.logger.info(`=======================================================`);
        });
        // Graceful Shutdown Handler
        const shutdown = async (signal) => {
            logger_1.logger.info(`Received ${signal}. Commencing graceful system shutdown...`);
            server.close(async () => {
                logger_1.logger.info('HTTP server closed.');
                await (0, database_1.disconnectDatabase)();
                logger_1.logger.info('Graceful shutdown completed successfully. Exiting.');
                process.exit(0);
            });
            // Force shutdown after timeout if pending connections hang
            setTimeout(() => {
                logger_1.logger.error('Forcefully terminating process due to shutdown timeout.');
                process.exit(1);
            }, 10000);
        };
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
    }
    catch (error) {
        logger_1.logger.error('Fatal initialization error in server bootstrap', { error: error.message });
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=server.js.map