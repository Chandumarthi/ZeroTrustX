import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  loginRateLimiter,
  otpRateLimiter,
  registerRateLimiter,
} from '../middleware/rateLimiter.middleware';
import { validateBody } from '../middleware/validate.middleware';
import {
  registerSchema,
  loginSchema,
  verifyOTPSchema,
  resendOTPSchema,
  bootstrapAdminSchema,
} from '../validators/auth.validators';

const router = Router();

// User Registration
router.post(
  '/register',
  registerRateLimiter,
  validateBody(registerSchema),
  authController.register.bind(authController)
);

// Adaptive Risk Login
router.post(
  '/login',
  loginRateLimiter,
  validateBody(loginSchema),
  authController.login.bind(authController)
);

// Step-Up OTP Verification
router.post(
  '/verify-otp',
  otpRateLimiter,
  validateBody(verifyOTPSchema),
  authController.verifyOTP.bind(authController)
);

// Resend Verification Code
router.post(
  '/resend-otp',
  otpRateLimiter,
  validateBody(resendOTPSchema),
  authController.resendOTP.bind(authController)
);

// Session Revocation (Logout)
router.post(
  '/logout',
  authMiddleware,
  authController.logout.bind(authController)
);

// Current User Profile Context
router.get(
  '/me',
  authMiddleware,
  authController.me.bind(authController)
);

// System Admin Bootstrap
router.post(
  '/bootstrap-admin',
  validateBody(bootstrapAdminSchema),
  authController.bootstrapAdmin.bind(authController)
);

export default router;
