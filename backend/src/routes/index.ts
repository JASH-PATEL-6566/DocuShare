import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import fileRoutes from "./file.routes";
import subscriptionRoutes from "./subscription.routes";
import linkRoutes from "./link.routes";
import accessRoutes from "./access.routes";
import publicRoutes from "./public.routes";
import accessLogRoutes from "./access-log.routes"; // Add access log routes

const router = Router();

// Register routes
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/files", fileRoutes);
router.use("/subscription", subscriptionRoutes);
router.use("/links", linkRoutes);
router.use("/access", accessRoutes);
router.use("/public", publicRoutes);

export default router;
