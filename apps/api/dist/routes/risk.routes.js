"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const risk_controller_1 = require("../controllers/risk.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Apply authentication middleware to all risk endpoints
router.use(auth_middleware_1.authMiddleware);
// Real-time risk evaluation
router.post('/assess', risk_controller_1.riskController.assessRisk.bind(risk_controller_1.riskController));
// Historical risk assessments for the authenticated user
router.get('/history', risk_controller_1.riskController.getRiskHistory.bind(risk_controller_1.riskController));
exports.default = router;
//# sourceMappingURL=risk.routes.js.map