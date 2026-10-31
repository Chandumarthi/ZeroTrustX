import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all user endpoints
router.use(authMiddleware);

// Retrieve user profile and registered devices
router.get('/profile', userController.getProfile.bind(userController));

// Retrieve user login activity history
router.get('/activity', userController.getActivity.bind(userController));

// Recognized device management
router.get('/devices', userController.getDevices.bind(userController));
router.delete('/devices/:deviceId', userController.revokeDevice.bind(userController));

// Security alerts
router.get('/alerts', userController.getAlerts.bind(userController));

// Risk assessment history
router.get('/risk-history', userController.getRiskHistory.bind(userController));
router.get('/latest-assessment', userController.getLatestAssessment.bind(userController));

export default router;
