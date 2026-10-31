"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
const env_1 = require("./config/env");
const logger_1 = require("./config/logger");
const requestLogger_middleware_1 = require("./middleware/requestLogger.middleware");
const rateLimiter_middleware_1 = require("./middleware/rateLimiter.middleware");
// Routes
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const risk_routes_1 = __importDefault(require("./routes/risk.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const health_routes_1 = __importDefault(require("./routes/health.routes"));
function createApp() {
    const app = (0, express_1.default)();
    // 1. Core Security Headers
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: env_1.config.NODE_ENV === 'production' ? undefined : false,
        crossOriginEmbedderPolicy: false,
    }));
    // 2. Cross-Origin Resource Sharing
    app.use((0, cors_1.default)({
        origin: [env_1.config.CORS_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'x-csrf-token'],
    }));
    // 3. Body Parsing & Cookie Handling
    app.use(express_1.default.json({ limit: '2mb' }));
    app.use(express_1.default.urlencoded({ extended: true, limit: '2mb' }));
    app.use((0, cookie_parser_1.default)(env_1.config.COOKIE_SECRET));
    // 4. Request Logging & Correlation
    app.use(requestLogger_middleware_1.requestLoggerMiddleware);
    if (env_1.config.NODE_ENV !== 'test') {
        app.use((0, morgan_1.default)(':method :url :status :res[content-length] - :response-time ms', {
            stream: {
                write: (message) => logger_1.logger.debug(message.trim()),
            },
        }));
    }
    // 5. Global Rate Limiter
    app.use(rateLimiter_middleware_1.generalRateLimiter);
    // 6. Mount Health Routes
    app.use('/health', health_routes_1.default);
    app.use('/api', health_routes_1.default); // for /api/health
    // 7. Mount Application API Routes
    app.use('/api/auth', auth_routes_1.default);
    app.use('/api/user', user_routes_1.default);
    app.use('/api/risk', risk_routes_1.default);
    app.use('/api/admin', admin_routes_1.default);
    // 8. 404 Route Handler
    app.use((req, res) => {
        res.status(404).json({
            success: false,
            error: `Endpoint not found: ${req.method} ${req.originalUrl}`,
        });
    });
    // 9. Global Error Handler
    app.use((err, req, res, _next) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || 'Internal server error';
        logger_1.logger.error('Unhandled API exception', {
            error: err.message,
            stack: env_1.config.NODE_ENV === 'production' ? undefined : err.stack,
            path: req.originalUrl,
            method: req.method,
            requestId: req.id,
        });
        res.status(status).json({
            success: false,
            error: env_1.config.NODE_ENV === 'production' && status === 500 ? 'An unexpected server error occurred.' : message,
            ...(env_1.config.NODE_ENV !== 'production' && { stack: err.stack }),
        });
    });
    return app;
}
exports.app = createApp();
//# sourceMappingURL=app.js.map