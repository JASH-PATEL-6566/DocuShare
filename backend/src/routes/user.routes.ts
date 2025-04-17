import { Router } from "express"
import userController from "../controllers/user.controller"
import { authenticate } from "../middleware/auth.middleware"

const router = Router()

// Update user
router.put("/", authenticate, userController.updateUser)

// Delete user
router.delete("/", authenticate, userController.deleteUser)

export default router
