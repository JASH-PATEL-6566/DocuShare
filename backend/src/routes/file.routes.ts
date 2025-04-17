import { Router } from "express";
import fileController from "../controllers/file.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// New direct file upload endpoint
router.post(
  "/upload",
  authenticate,
  (req, res, next) => fileController.uploadMiddleware(req, res, next),
  fileController.uploadFile.bind(fileController)
);

// Get pre-signed URL for file upload (keeping for backward compatibility)
router.post("/upload-url", authenticate, fileController.getUploadUrl);

// Confirm file upload (keeping for backward compatibility)
router.post("/confirm-upload", authenticate, fileController.confirmUpload);

// Get user's files
router.get("/", authenticate, fileController.getUserFiles);

// Get pre-signed URL for file download
router.get(
  "/:fileId/download-url",
  authenticate,
  fileController.getDownloadUrl
);

// Delete file
router.delete("/:fileId", authenticate, fileController.deleteFile);

export default router;
