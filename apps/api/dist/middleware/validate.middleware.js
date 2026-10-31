"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBody = validateBody;
const zod_1 = require("zod");
function validateBody(schema) {
    return async (req, res, next) => {
        try {
            req.body = await schema.parseAsync(req.body);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const issues = error.errors || error.issues || [];
                const errorDetails = issues.map((e) => ({
                    field: Array.isArray(e.path) ? e.path.join('.') : String(e.path || ''),
                    message: e.message,
                }));
                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errorDetails,
                });
                return;
            }
            res.status(400).json({
                success: false,
                error: 'Invalid request data',
            });
        }
    };
}
//# sourceMappingURL=validate.middleware.js.map