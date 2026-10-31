"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const admin_middleware_1 = require("../middleware/admin.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const admin_validators_1 = require("../validators/admin.validators");
const router = (0, express_1.Router)();
// Enforce authentication followed by admin authorization on all admin routes
router.use(auth_middleware_1.authMiddleware);
router.use(admin_middleware_1.adminMiddleware);
// SOC Telemetry & Dashboard Metrics
router.get('/dashboard', admin_controller_1.adminController.getDashboard.bind(admin_controller_1.adminController));
// User Directory
router.get('/users', admin_controller_1.adminController.getUsers.bind(admin_controller_1.adminController));
router.get('/users/:userId', admin_controller_1.adminController.getUserDetails.bind(admin_controller_1.adminController));
router.patch('/users/:userId/status', admin_controller_1.adminController.updateUserStatus.bind(admin_controller_1.adminController));
router.patch('/users/:userId/role', admin_controller_1.adminController.updateUserRole.bind(admin_controller_1.adminController));
// Security Audit Trail
router.get('/audit-logs', admin_controller_1.adminController.getAuditLogs.bind(admin_controller_1.adminController));
// Threat & Risk Assessments
router.get('/risk-events', admin_controller_1.adminController.getRiskEvents.bind(admin_controller_1.adminController));
// Adaptive Policies — support both URL patterns for compatibility
router.get('/risk-policies', admin_controller_1.adminController.getRiskPolicies.bind(admin_controller_1.adminController));
router.put('/risk-policies', (0, validate_middleware_1.validateBody)(admin_validators_1.updateRiskPolicySchema), admin_controller_1.adminController.updateRiskPolicy.bind(admin_controller_1.adminController));
router.get('/policies', admin_controller_1.adminController.getRiskPolicies.bind(admin_controller_1.adminController));
router.put('/policies/:policyId', (0, validate_middleware_1.validateBody)(admin_validators_1.updateRiskPolicySchema), admin_controller_1.adminController.updateRiskPolicy.bind(admin_controller_1.adminController));
exports.default = router;
//# sourceMappingURL=admin.routes.js.map