import { z } from 'zod';
declare const envSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<{
        development: "development";
        test: "test";
        production: "production";
    }>>;
    PORT: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    DATABASE_URL: z.ZodDefault<z.ZodString>;
    JWT_SECRET: z.ZodDefault<z.ZodString>;
    JWT_EXPIRES_IN: z.ZodDefault<z.ZodString>;
    JWT_REFRESH_EXPIRES_IN: z.ZodDefault<z.ZodString>;
    ML_SERVICE_SECRET: z.ZodDefault<z.ZodString>;
    ML_SERVICE_URL: z.ZodDefault<z.ZodString>;
    COOKIE_SECRET: z.ZodDefault<z.ZodString>;
    CORS_ORIGIN: z.ZodDefault<z.ZodString>;
    EMAIL_ADAPTER: z.ZodDefault<z.ZodEnum<{
        development: "development";
        brevo: "brevo";
        smtp: "smtp";
    }>>;
    BREVO_API_KEY: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    EMAIL_FROM_ADDRESS: z.ZodDefault<z.ZodString>;
    EMAIL_FROM_NAME: z.ZodDefault<z.ZodString>;
    SMTP_HOST: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    SMTP_PORT: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    SMTP_SECURE: z.ZodDefault<z.ZodPreprocess<z.ZodBoolean, unknown>>;
    SMTP_USER: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    SMTP_PASS: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    OTP_EXPIRES_IN_SECONDS: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    OTP_MAX_ATTEMPTS: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    OTP_RESEND_COOLDOWN_SECONDS: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    RATE_LIMIT_LOGIN_MAX: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    RATE_LIMIT_LOGIN_WINDOW_MS: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    RATE_LIMIT_OTP_MAX: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    RATE_LIMIT_OTP_WINDOW_MS: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    RATE_LIMIT_REGISTER_MAX: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    RATE_LIMIT_REGISTER_WINDOW_MS: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    ADMIN_BOOTSTRAP_SECRET: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export type EnvConfig = z.infer<typeof envSchema>;
export declare const config: EnvConfig;
export {};
//# sourceMappingURL=env.d.ts.map