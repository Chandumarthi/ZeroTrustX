import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env file from app directory, or root workspace if present
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required').default(
    process.env.NODE_ENV === 'test'
      ? 'postgresql://postgres:postgres@localhost:5432/zerotrust_test?schema=public'
      : (process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/zerotrust_db?schema=public')
  ),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters').default(
    process.env.NODE_ENV === 'production'
      ? ''
      : (process.env.JWT_SECRET || 'dev_secret_key_zerotrustx_secure_token_signing_2026')
  ),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  ML_SERVICE_SECRET: z.string().default('dev_ml_service_internal_secret_2026'),
  ML_SERVICE_URL: z.string().url().default('http://localhost:5001'),
  COOKIE_SECRET: z.string().default('dev_cookie_secret_zerotrustx_2026'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  // Email Config
  EMAIL_ADAPTER: z.enum(['development', 'brevo', 'smtp']).default('development'),
  BREVO_API_KEY: z.string().optional().default(''),
  EMAIL_FROM_ADDRESS: z.string().email().default('noreply@zerotrust-x.com'),
  EMAIL_FROM_NAME: z.string().default('ZeroTrustX Security'),
  SMTP_HOST: z.string().optional().default('localhost'),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),

  // OTP Config
  OTP_EXPIRES_IN_SECONDS: z.coerce.number().default(300),
  OTP_MAX_ATTEMPTS: z.coerce.number().default(5),
  OTP_RESEND_COOLDOWN_SECONDS: z.coerce.number().default(60),

  // Rate Limiting
  RATE_LIMIT_LOGIN_MAX: z.coerce.number().default(10),
  RATE_LIMIT_LOGIN_WINDOW_MS: z.coerce.number().default(900000), // 15 mins
  RATE_LIMIT_OTP_MAX: z.coerce.number().default(10),
  RATE_LIMIT_OTP_WINDOW_MS: z.coerce.number().default(600000), // 10 mins
  RATE_LIMIT_REGISTER_MAX: z.coerce.number().default(5),
  RATE_LIMIT_REGISTER_WINDOW_MS: z.coerce.number().default(3600000), // 1 hour

  // Admin Bootstrap
  ADMIN_BOOTSTRAP_SECRET: z.string().optional().default(
    process.env.ADMIN_BOOTSTRAP_SECRET || 'bootstrap_admin_secret_zerotrustx_2026'
  ),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
  console.error('\x1b[31m%s\x1b[0m', 'CRITICAL: Environment validation failed:\n' + issues);
  throw new Error(`Environment validation failed:\n${issues}`);
}

export type EnvConfig = z.infer<typeof envSchema>;
export const config: EnvConfig = parsed.data;
