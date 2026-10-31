import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { adminMiddleware } from '../middleware/admin.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { updateRiskPolicySchema } from '../validators/admin.validators';

const router = Router();

// Enforce authentication followed by admin authorization on all admin routes
router.use(authMiddleware);
router.use(adminMiddleware);

// SOC Telemetry & Dashboard Metrics
router.get('/dashboard', adminController.getDashboard.bind(adminController));

// User Directory
router.get('/users', adminController.getUsers.bind(adminController));
router.get('/users/:userId', adminController.getUserDetails.bind(adminController));
router.patch('/users/:userId/status', adminController.updateUserStatus.bind(adminController));
router.patch('/users/:userId/role', adminController.updateUserRole.bind(adminController));

// Security Audit Trail
router.get('/audit-logs', adminController.getAuditLogs.bind(adminController));

// Threat & Risk Assessments
router.get('/risk-events', adminController.getRiskEvents.bind(adminController));

// Adaptive Policies — support both URL patterns for compatibility
router.get('/risk-policies', adminController.getRiskPolicies.bind(adminController));
router.put(
  '/risk-policies',
  validateBody(updateRiskPolicySchema),
  adminController.updateRiskPolicy.bind(adminController)
);
router.get('/policies', adminController.getRiskPolicies.bind(adminController));
router.put(
  '/policies/:policyId',
  validateBody(updateRiskPolicySchema),
  adminController.updateRiskPolicy.bind(adminController)
);

export default router;
