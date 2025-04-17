import { Router } from "express";
import accessLogController from "../controllers/access-log.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// All routes require authentication
router.get("/logs", authenticate, accessLogController.getAccessLogs);
router.get("/logs/stats", authenticate, accessLogController.getAccessLogStats);

export default router;
