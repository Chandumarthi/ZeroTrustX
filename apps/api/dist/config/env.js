"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const zod_1 = require("zod");
// Load .env file from app directory, or root workspace if present
dotenv_1.default.config();
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../../../.env') });
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'test', 'production']).default('development'),
    PORT: zod_1.z.coerce.number().default(3001),
    DATABASE_URL: zod_1.z.string().min(1, 'DATABASE_URL is required').default(process.env.NODE_ENV === 'test'
        ? 'postgresql://postgres:postgres@localhost:5432/zerotrust_test?schema=public'
        : (process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/zerotrust_db?schema=public')),
    JWT_SECRET: zod_1.z.string().min(16, 'JWT_SECRET must be at least 16 characters').default(process.env.NODE_ENV === 'production'
        ? ''
        : (process.env.JWT_SECRET || 'dev_secret_key_zerotrustx_secure_token_signing_2026')),
    JWT_EXPIRES_IN: zod_1.z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: zod_1.z.string().default('7d'),
    ML_SERVICE_SECRET: zod_1.z.string().default('dev_ml_service_internal_secret_2026'),
    ML_SERVICE_URL: zod_1.z.string().url().default('http://localhost:5001'),
    COOKIE_SECRET: zod_1.z.string().default('dev_cookie_secret_zerotrustx_2026'),
    CORS_ORIGIN: zod_1.z.string().default('http://localhost:5173'),
    // Email Config
    EMAIL_ADAPTER: zod_1.z.enum(['development', 'brevo', 'smtp']).default('development'),
    BREVO_API_KEY: zod_1.z.string().optional().default(''),
    EMAIL_FROM_ADDRESS: zod_1.z.string().email().default('noreply@zerotrust-x.com'),
    EMAIL_FROM_NAME: zod_1.z.string().default('ZeroTrustX Security'),
    SMTP_HOST: zod_1.z.string().optional().default('localhost'),
    SMTP_PORT: zod_1.z.coerce.number().default(587),
    SMTP_SECURE: zod_1.z.preprocess((val) => val === 'true' || val === true, zod_1.z.boolean()).default(false),
    SMTP_USER: zod_1.z.string().optional().default(''),
    SMTP_PASS: zod_1.z.string().optional().default(''),
    // OTP Config
    OTP_EXPIRES_IN_SECONDS: zod_1.z.coerce.number().default(300),
    OTP_MAX_ATTEMPTS: zod_1.z.coerce.number().default(5),
    OTP_RESEND_COOLDOWN_SECONDS: zod_1.z.coerce.number().default(60),
    // Rate Limiting
    RATE_LIMIT_LOGIN_MAX: zod_1.z.coerce.number().default(10),
    RATE_LIMIT_LOGIN_WINDOW_MS: zod_1.z.coerce.number().default(900000), // 15 mins
    RATE_LIMIT_OTP_MAX: zod_1.z.coerce.number().default(10),
    RATE_LIMIT_OTP_WINDOW_MS: zod_1.z.coerce.number().default(600000), // 10 mins
    RATE_LIMIT_REGISTER_MAX: zod_1.z.coerce.number().default(5),
    RATE_LIMIT_REGISTER_WINDOW_MS: zod_1.z.coerce.number().default(3600000), // 1 hour
    // Admin Bootstrap
    ADMIN_BOOTSTRAP_SECRET: zod_1.z.string().optional().default(process.env.ADMIN_BOOTSTRAP_SECRET || 'bootstrap_admin_secret_zerotrustx_2026'),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    console.error('\x1b[31m%s\x1b[0m', 'CRITICAL: Environment validation failed:\n' + issues);
    throw new Error(`Environment validation failed:\n${issues}`);
}
exports.config = parsed.data;
//# sourceMappingURL=env.js.map