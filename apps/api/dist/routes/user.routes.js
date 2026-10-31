"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Apply authentication middleware to all user endpoints
router.use(auth_middleware_1.authMiddleware);
// Retrieve user profile and registered devices
router.get('/profile', user_controller_1.userController.getProfile.bind(user_controller_1.userController));
// Retrieve user login activity history
router.get('/activity', user_controller_1.userController.getActivity.bind(user_controller_1.userController));
// Recognized device management
router.get('/devices', user_controller_1.userController.getDevices.bind(user_controller_1.userController));
router.delete('/devices/:deviceId', user_controller_1.userController.revokeDevice.bind(user_controller_1.userController));
// Security alerts
router.get('/alerts', user_controller_1.userController.getAlerts.bind(user_controller_1.userController));
// Risk assessment history
router.get('/risk-history', user_controller_1.userController.getRiskHistory.bind(user_controller_1.userController));
router.get('/latest-assessment', user_controller_1.userController.getLatestAssessment.bind(user_controller_1.userController));
exports.default = router;
//# sourceMappingURL=user.routes.js.map