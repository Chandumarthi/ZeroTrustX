"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const axios_1 = __importDefault(require("axios"));
const database_1 = require("../config/database");
const env_1 = require("../config/env");
const logger_1 = require("../config/logger");
const router = (0, express_1.Router)();
/**
 * Basic liveness check endpoint
 */
router.get('/', (req, res) => {
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
router.get('/health', async (req, res) => {
    const healthStatus = {
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
                url: env_1.config.ML_SERVICE_URL,
            },
        },
    };
    // Test Database Connectivity
    const dbStart = Date.now();
    try {
        await database_1.prisma.$queryRaw `SELECT 1`;
        healthStatus.services.database.status = 'up';
        healthStatus.services.database.latencyMs = Date.now() - dbStart;
    }
    catch (error) {
        healthStatus.services.database.status = 'down';
        healthStatus.services.database.error = error.message;
        healthStatus.status = 'unhealthy';
        logger_1.logger.error('Health check database query failure', { error: error.message });
    }
    // Test ML Engine Connectivity
    const mlStart = Date.now();
    try {
        await axios_1.default.get(`${env_1.config.ML_SERVICE_URL}/health`, {
            timeout: 2000,
            headers: {
                'X-Internal-Secret': env_1.config.ML_SERVICE_SECRET,
            },
        });
        healthStatus.services.mlEngine.status = 'up';
        healthStatus.services.mlEngine.latencyMs = Date.now() - mlStart;
    }
    catch (error) {
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
exports.default = router;
//# sourceMappingURL=health.routes.js.map