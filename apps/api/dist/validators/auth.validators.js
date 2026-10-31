"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bootstrapAdminSchema = exports.resendOTPSchema = exports.verifyOTPSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const passwordComplexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
exports.registerSchema = zod_1.z
    .object({
    email: zod_1.z.string().trim().email('Invalid email address').toLowerCase(),
    password: zod_1.z
        .string()
        .min(8, 'Password must be at least 8 characters long')
        .regex(passwordComplexityRegex, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    fullName: zod_1.z.string().trim().min(2, 'Full name must be at least 2 characters long').max(100).optional(),
    name: zod_1.z.string().trim().min(2, 'Full name must be at least 2 characters long').max(100).optional(),
})
    .refine((data) => data.fullName || data.name, {
    message: 'Full name is required',
    path: ['fullName'],
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().trim().email('Invalid email address').toLowerCase(),
    password: zod_1.z.string().min(1, 'Password is required'),
});
exports.verifyOTPSchema = zod_1.z.object({
    challengeId: zod_1.z.string().uuid('Invalid challenge ID format'),
    otp: zod_1.z.string().regex(/^\d{6}$/, 'OTP must be a 6-digit numeric code'),
});
exports.resendOTPSchema = zod_1.z.object({
    challengeId: zod_1.z.string().uuid('Invalid challenge ID format'),
});
exports.bootstrapAdminSchema = zod_1.z.object({
    email: zod_1.z.string().trim().email('Invalid email address').toLowerCase(),
    password: zod_1.z
        .string()
        .min(8, 'Password must be at least 8 characters long')
        .regex(passwordComplexityRegex, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    fullName: zod_1.z.string().trim().min(2, 'Full name must be at least 2 characters long'),
    bootstrapSecret: zod_1.z.string().min(1, 'Admin bootstrap secret is required'),
});
//# sourceMappingURL=auth.validators.js.map