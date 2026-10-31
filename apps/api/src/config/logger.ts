import winston from 'winston';
import { config } from './env';

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
export function sanitizeLogData(obj: any): any {
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
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_KEYS.has(lowerKey)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeLogData(value);
      }
    }
    return sanitized;
  }

  return obj;
}

const sanitizeFormat = winston.format((info) => {
  for (const key of Object.keys(info)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey)) {
      info[key] = '[REDACTED]';
    } else if (typeof info[key] === 'object' && info[key] !== null) {
      info[key] = sanitizeLogData(info[key]);
    } else if (typeof info[key] === 'string') {
      info[key] = sanitizeLogData(info[key]);
    }
  }
  return info;
});

const developmentFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.printf(({ timestamp, level, message, requestId, ...meta }) => {
    const reqStr = requestId ? ` [${requestId}]` : '';
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}]${reqStr} ${level}: ${message}${metaStr}`;
  })
);

const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: config.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(sanitizeFormat(), config.NODE_ENV === 'production' ? productionFormat : developmentFormat),
  transports: [
    new winston.transports.Console()
  ],
  exitOnError: false
});

/**
 * Create a child logger with a correlation requestId
 */
export function getRequestLogger(requestId: string) {
  return logger.child({ requestId });
}
