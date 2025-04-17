import { Router } from "express"
import subscriptionController from "../controllers/subscription.controller"
import { authenticate } from "../middleware/auth.middleware"

const router = Router()

// Get user's subscription
router.get("/plan", authenticate, subscriptionController.getUserSubscription)

// Upgrade subscription
router.post("/upgrade", authenticate, subscriptionController.upgradeSubscription)

// Cancel subscription
router.post("/cancel", authenticate, subscriptionController.cancelSubscription)

export default router
