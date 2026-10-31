import { z } from 'zod';

const passwordComplexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

export const registerSchema = z
  .object({
    email: z.string().trim().email('Invalid email address').toLowerCase(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(
        passwordComplexityRegex,
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      ),
    fullName: z.string().trim().min(2, 'Full name must be at least 2 characters long').max(100).optional(),
    name: z.string().trim().min(2, 'Full name must be at least 2 characters long').max(100).optional(),
  })
  .refine((data) => data.fullName || data.name, {
    message: 'Full name is required',
    path: ['fullName'],
  });

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const verifyOTPSchema = z.object({
  challengeId: z.string().uuid('Invalid challenge ID format'),
  otp: z.string().regex(/^\d{6}$/, 'OTP must be a 6-digit numeric code'),
});

export const resendOTPSchema = z.object({
  challengeId: z.string().uuid('Invalid challenge ID format'),
});

export const bootstrapAdminSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(
      passwordComplexityRegex,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters long'),
  bootstrapSecret: z.string().min(1, 'Admin bootstrap secret is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyOTPInput = z.infer<typeof verifyOTPSchema>;
export type ResendOTPInput = z.infer<typeof resendOTPSchema>;
export type BootstrapAdminInput = z.infer<typeof bootstrapAdminSchema>;
