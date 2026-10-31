"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRiskPolicySchema = void 0;
const zod_1 = require("zod");
exports.updateRiskPolicySchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100).optional(),
    description: zod_1.z.string().max(255).optional(),
    thresholds: zod_1.z
        .object({
        lowMax: zod_1.z.number().min(1).max(99),
        mediumMax: zod_1.z.number().min(1).max(99),
        highMax: zod_1.z.number().min(1).max(99),
    })
        .refine((data) => data.lowMax < data.mediumMax && data.mediumMax < data.highMax, {
        message: 'Thresholds must satisfy: lowMax < mediumMax < highMax',
    })
        .optional(),
    weights: zod_1.z
        .object({
        mlWeight: zod_1.z.number().min(0).max(1).optional(),
        unknownDevice: zod_1.z.number().min(0).max(100).optional(),
        unknownIp: zod_1.z.number().min(0).max(100).optional(),
        failedAttemptUnit: zod_1.z.number().min(0).max(50).optional(),
        failedAttemptMax: zod_1.z.number().min(0).max(100).optional(),
        offHoursLogin: zod_1.z.number().min(0).max(50).optional(),
        deviceChanged: zod_1.z.number().min(0).max(50).optional(),
        ipChanged: zod_1.z.number().min(0).max(50).optional(),
    })
        .optional(),
    isActive: zod_1.z.boolean().optional(),
});
//# sourceMappingURL=admin.validators.js.map