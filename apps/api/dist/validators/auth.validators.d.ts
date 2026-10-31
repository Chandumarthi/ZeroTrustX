import { z } from 'zod';
export declare const registerSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    fullName: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export declare const verifyOTPSchema: z.ZodObject<{
    challengeId: z.ZodString;
    otp: z.ZodString;
}, z.core.$strip>;
export declare const resendOTPSchema: z.ZodObject<{
    challengeId: z.ZodString;
}, z.core.$strip>;
export declare const bootstrapAdminSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    fullName: z.ZodString;
    bootstrapSecret: z.ZodString;
}, z.core.$strip>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyOTPInput = z.infer<typeof verifyOTPSchema>;
export type ResendOTPInput = z.infer<typeof resendOTPSchema>;
export type BootstrapAdminInput = z.infer<typeof bootstrapAdminSchema>;
//# sourceMappingURL=auth.validators.d.ts.map