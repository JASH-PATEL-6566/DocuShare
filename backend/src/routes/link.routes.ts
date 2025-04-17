import { Router } from "express"
import linkController from "../controllers/link.controller"
import { authenticate } from "../middleware/auth.middleware"

const router = Router()

// All routes require authentication
router.use(authenticate)

// Create a new link
router.post("/", linkController.createLink)

// Get all links for the user
router.get("/", linkController.getUserLinks)

// Get a specific link
router.get("/:linkId", linkController.getLinkById)

// Update a link
router.put("/:linkId", linkController.updateLink)

// Revoke a link
router.post("/:linkId/revoke", linkController.revokeLink)

// Activate a link
router.post("/:linkId/activate", linkController.activateLink)

// Delete a link
router.delete("/:linkId", linkController.deleteLink)

export default router
