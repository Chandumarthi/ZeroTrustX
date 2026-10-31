"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLoggerMiddleware = requestLoggerMiddleware;
const uuid_1 = require("uuid");
const logger_1 = require("../config/logger");
function requestLoggerMiddleware(req, res, next) {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] || (0, uuid_1.v4)();
    req.id = requestId;
    res.setHeader('X-Request-Id', requestId);
    // Hook into response finish event
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const { method, originalUrl } = req;
        const { statusCode } = res;
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        // Log with request ID context, omitting authorization headers/cookies
        logger_1.logger.info(`${method} ${originalUrl} ${statusCode} ${duration}ms`, {
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
//# sourceMappingURL=requestLogger.middleware.js.map