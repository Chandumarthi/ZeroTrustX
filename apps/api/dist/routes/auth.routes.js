"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rateLimiter_middleware_1 = require("../middleware/rateLimiter.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const auth_validators_1 = require("../validators/auth.validators");
const router = (0, express_1.Router)();
// User Registration
router.post('/register', rateLimiter_middleware_1.registerRateLimiter, (0, validate_middleware_1.validateBody)(auth_validators_1.registerSchema), auth_controller_1.authController.register.bind(auth_controller_1.authController));
// Adaptive Risk Login
router.post('/login', rateLimiter_middleware_1.loginRateLimiter, (0, validate_middleware_1.validateBody)(auth_validators_1.loginSchema), auth_controller_1.authController.login.bind(auth_controller_1.authController));
// Step-Up OTP Verification
router.post('/verify-otp', rateLimiter_middleware_1.otpRateLimiter, (0, validate_middleware_1.validateBody)(auth_validators_1.verifyOTPSchema), auth_controller_1.authController.verifyOTP.bind(auth_controller_1.authController));
// Resend Verification Code
router.post('/resend-otp', rateLimiter_middleware_1.otpRateLimiter, (0, validate_middleware_1.validateBody)(auth_validators_1.resendOTPSchema), auth_controller_1.authController.resendOTP.bind(auth_controller_1.authController));
// Session Revocation (Logout)
router.post('/logout', auth_middleware_1.authMiddleware, auth_controller_1.authController.logout.bind(auth_controller_1.authController));
// Current User Profile Context
router.get('/me', auth_middleware_1.authMiddleware, auth_controller_1.authController.me.bind(auth_controller_1.authController));
// System Admin Bootstrap
router.post('/bootstrap-admin', (0, validate_middleware_1.validateBody)(auth_validators_1.bootstrapAdminSchema), auth_controller_1.authController.bootstrapAdmin.bind(auth_controller_1.authController));
exports.default = router;
//# sourceMappingURL=auth.routes.js.map