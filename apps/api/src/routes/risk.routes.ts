import { Router } from 'express';
import { riskController } from '../controllers/risk.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all risk endpoints
router.use(authMiddleware);

// Real-time risk evaluation
router.post('/assess', riskController.assessRisk.bind(riskController));

// Historical risk assessments for the authenticated user
router.get('/history', riskController.getRiskHistory.bind(riskController));

export default router;
