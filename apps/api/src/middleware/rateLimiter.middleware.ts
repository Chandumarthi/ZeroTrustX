import rateLimit from 'express-rate-limit';
import { config } from '../config/env';

export const loginRateLimiter = rateLimit({
  windowMs: config.NODE_ENV === 'development' ? 60 * 1000 : config.RATE_LIMIT_LOGIN_WINDOW_MS,
  max: config.NODE_ENV === 'development' ? 500 : config.RATE_LIMIT_LOGIN_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many login attempts. Please try again later.',
  },
});

export const otpRateLimiter = rateLimit({
  windowMs: config.NODE_ENV === 'development' ? 60 * 1000 : config.RATE_LIMIT_OTP_WINDOW_MS,
  max: config.NODE_ENV === 'development' ? 500 : config.RATE_LIMIT_OTP_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many OTP verification attempts. Please wait before trying again.',
  },
});

export const registerRateLimiter = rateLimit({
  windowMs: config.NODE_ENV === 'development' ? 60 * 1000 : config.RATE_LIMIT_REGISTER_WINDOW_MS,
  max: config.NODE_ENV === 'development' ? 500 : config.RATE_LIMIT_REGISTER_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many registration requests from this IP. Please try again later.',
  },
});

export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 100, // 100 requests per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Please slow down.',
  },
});
