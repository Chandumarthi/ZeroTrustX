import { z } from 'zod';
export declare const updateRiskPolicySchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    thresholds: z.ZodOptional<z.ZodObject<{
        lowMax: z.ZodNumber;
        mediumMax: z.ZodNumber;
        highMax: z.ZodNumber;
    }, z.core.$strip>>;
    weights: z.ZodOptional<z.ZodObject<{
        mlWeight: z.ZodOptional<z.ZodNumber>;
        unknownDevice: z.ZodOptional<z.ZodNumber>;
        unknownIp: z.ZodOptional<z.ZodNumber>;
        failedAttemptUnit: z.ZodOptional<z.ZodNumber>;
        failedAttemptMax: z.ZodOptional<z.ZodNumber>;
        offHoursLogin: z.ZodOptional<z.ZodNumber>;
        deviceChanged: z.ZodOptional<z.ZodNumber>;
        ipChanged: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export type UpdateRiskPolicyInput = z.infer<typeof updateRiskPolicySchema>;
//# sourceMappingURL=admin.validators.d.ts.map