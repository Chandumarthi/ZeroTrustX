import { z } from 'zod';

export const updateRiskPolicySchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(255).optional(),
  thresholds: z
    .object({
      lowMax: z.number().min(1).max(99),
      mediumMax: z.number().min(1).max(99),
      highMax: z.number().min(1).max(99),
    })
    .refine((data) => data.lowMax < data.mediumMax && data.mediumMax < data.highMax, {
      message: 'Thresholds must satisfy: lowMax < mediumMax < highMax',
    })
    .optional(),
  weights: z
    .object({
      mlWeight: z.number().min(0).max(1).optional(),
      unknownDevice: z.number().min(0).max(100).optional(),
      unknownIp: z.number().min(0).max(100).optional(),
      failedAttemptUnit: z.number().min(0).max(50).optional(),
      failedAttemptMax: z.number().min(0).max(100).optional(),
      offHoursLogin: z.number().min(0).max(50).optional(),
      deviceChanged: z.number().min(0).max(50).optional(),
      ipChanged: z.number().min(0).max(50).optional(),
    })
    .optional(),
  isActive: z.boolean().optional(),
});

export type UpdateRiskPolicyInput = z.infer<typeof updateRiskPolicySchema>;
