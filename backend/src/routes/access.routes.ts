import { Router } from "express";
import accessController from "../controllers/access.controller";
import accessLogController from "../controllers/access-log.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create a new access grant
router.post("/grants", accessController.createAccessGrant);

// Revoke an access grant
router.post("/grants/:grantId/revoke", accessController.revokeAccessGrant);

// Get all access grants for a link
router.get("/links/:linkId/grants", accessController.getLinkAccessGrants);

router.get("/logs", authenticate, accessLogController.getAccessLogs);
router.get("/logs/stats", authenticate, accessLogController.getAccessLogStats);

export default router;
