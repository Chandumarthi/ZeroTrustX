"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.sanitizeLogData = sanitizeLogData;
exports.getRequestLogger = getRequestLogger;
const winston_1 = __importDefault(require("winston"));
const env_1 = require("./env");
const SENSITIVE_KEYS = new Set([
    'password',
    'passwordhash',
    'token',
    'accesstoken',
    'refreshtoken',
    'otp',
    'code',
    'codehash',
    'secret',
    'jwt_secret',
    'cookie_secret',
    'ml_service_secret',
    'brevo_api_key',
    'authorization',
    'cookie',
    'apikey',
]);
/**
 * Recursively sanitizes any sensitive information from log payloads
 */
function sanitizeLogData(obj) {
    if (obj === null || obj === undefined) {
        return obj;
    }
    if (typeof obj === 'string') {
        // Mask potential JWT patterns
        if (/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(obj)) {
            return '[REDACTED_JWT]';
        }
        // Mask potential 6-digit numeric OTPs
        if (/^\d{6}$/.test(obj)) {
            return '[REDACTED_OTP]';
        }
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(sanitizeLogData);
    }
    if (typeof obj === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            const lowerKey = key.toLowerCase();
            if (SENSITIVE_KEYS.has(lowerKey)) {
                sanitized[key] = '[REDACTED]';
            }
            else {
                sanitized[key] = sanitizeLogData(value);
            }
        }
        return sanitized;
    }
    return obj;
}
const sanitizeFormat = winston_1.default.format((info) => {
    for (const key of Object.keys(info)) {
        const lowerKey = key.toLowerCase();
        if (SENSITIVE_KEYS.has(lowerKey)) {
            info[key] = '[REDACTED]';
        }
        else if (typeof info[key] === 'object' && info[key] !== null) {
            info[key] = sanitizeLogData(info[key]);
        }
        else if (typeof info[key] === 'string') {
            info[key] = sanitizeLogData(info[key]);
        }
    }
    return info;
});
const developmentFormat = winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }), winston_1.default.format.printf(({ timestamp, level, message, requestId, ...meta }) => {
    const reqStr = requestId ? ` [${requestId}]` : '';
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}]${reqStr} ${level}: ${message}${metaStr}`;
}));
const productionFormat = winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json());
exports.logger = winston_1.default.createLogger({
    level: env_1.config.NODE_ENV === 'production' ? 'info' : 'debug',
    format: winston_1.default.format.combine(sanitizeFormat(), env_1.config.NODE_ENV === 'production' ? productionFormat : developmentFormat),
    transports: [
        new winston_1.default.transports.Console()
    ],
    exitOnError: false
});
/**
 * Create a child logger with a correlation requestId
 */
function getRequestLogger(requestId) {
    return exports.logger.child({ requestId });
}
//# sourceMappingURL=logger.js.map