"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generalRateLimiter = exports.registerRateLimiter = exports.otpRateLimiter = exports.loginRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const env_1 = require("../config/env");
exports.loginRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: env_1.config.RATE_LIMIT_LOGIN_WINDOW_MS, // 15 mins default
    max: env_1.config.RATE_LIMIT_LOGIN_MAX, // 10 attempts
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: 'Too many login attempts. Please try again later.',
    },
});
exports.otpRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: env_1.config.RATE_LIMIT_OTP_WINDOW_MS, // 10 mins default
    max: env_1.config.RATE_LIMIT_OTP_MAX, // 10 attempts
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: 'Too many OTP verification attempts. Please wait before trying again.',
    },
});
exports.registerRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: env_1.config.RATE_LIMIT_REGISTER_WINDOW_MS, // 1 hour default
    max: env_1.config.RATE_LIMIT_REGISTER_MAX, // 5 attempts
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: 'Too many registration requests from this IP. Please try again later.',
    },
});
exports.generalRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 mins
    max: 100, // 100 requests per 15 min
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: 'Too many requests. Please slow down.',
    },
});
//# sourceMappingURL=rateLimiter.middleware.js.map