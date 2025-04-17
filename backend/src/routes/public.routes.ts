import { Router } from "express";
import publicController from "../controllers/public.controller";
import { rateLimiter } from "../middleware/rate-limiter.middleware";

const router = Router();

// Get public link information
router.get("/links/:linkId", publicController.getLinkInfo);

// Get file content (if not password protected)
router.get("/links/:linkId/content", publicController.getFileContent);

// Verify password and get content
router.post(
  "/links/:linkId/verify-password",
  // rateLimiter({
  //   windowMs: 15 * 60 * 1000,
  //   max: 5,
  //   message: "Too many password attempts, please try again later",
  // }),
  publicController.verifyPassword
);

export default router;
