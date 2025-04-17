import type { Request, Response } from "express"
import s3Service from "../services/s3.service"
import type { FileCreateInput } from "../models/file.model"
import multer from "multer"
import { v4 as uuidv4 } from "uuid"

// Configure multer for memory storage
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
})

export class FileController {
  // Middleware for handling file uploads
  uploadMiddleware = upload.single("file")

  // New direct upload endpoint
  async uploadFile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Authentication required" })
        return
      }

      if (!req.file) {
        res.status(400).json({ message: "No file uploaded" })
        return
      }

      const file = req.file
      const fileId = uuidv4()
      const fileName = file.originalname
      const fileType = file.mimetype
      const fileSize = file.size

      // Create S3 key (path in the bucket)
      const s3Key = `${req.user.userId}/${fileId}/${fileName}`

      // Upload file to S3
      const uploadResult = await s3Service.uploadFileToS3(s3Key, file.buffer, fileType)

      if (!uploadResult) {
        res.status(500).json({ message: "Failed to upload file to S3" })
        return
      }

      // Create file record
      const fileInput: FileCreateInput = {
        userId: req.user.userId,
        fileName,
        fileSize,
        fileType,
        s3Key,
      }

      // Save file metadata
      const fileResponse = await s3Service.confirmUpload(fileInput)

      res.status(200).json(fileResponse)
    } catch (error) {
      console.error("Error in uploadFile controller:", error)

      if ((error as any).code === "LIMIT_FILE_SIZE") {
        res.status(413).json({ message: "File too large. Maximum size is 100MB." })
      } else {
        res.status(500).json({ message: "Internal server error" })
      }
    }
  }

  // Existing methods remain unchanged
  async getUploadUrl(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Authentication required" })
        return
      }

      const { fileName, fileType } = req.body

      if (!fileName || !fileType) {
        res.status(400).json({ message: "File name and type are required" })
        return
      }

      const uploadUrlResponse = await s3Service.generateUploadUrl(req.user.userId, fileName, fileType)

      res.status(200).json(uploadUrlResponse)
    } catch (error) {
      console.error("Error in getUploadUrl controller:", error)
      res.status(500).json({ message: "Internal server error" })
    }
  }

  async confirmUpload(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Authentication required" })
        return
      }

      const { fileId, s3Key, fileName, fileSize, fileType } = req.body

      if (!fileId || !s3Key || !fileName || !fileSize || !fileType) {
        res.status(400).json({ message: "Missing required file information" })
        return
      }

      const fileInput: FileCreateInput = {
        userId: req.user.userId,
        fileName,
        fileSize,
        fileType,
        s3Key,
      }

      const fileResponse = await s3Service.confirmUpload(fileInput)

      res.status(200).json(fileResponse)
    } catch (error) {
      console.error("Error in confirmUpload controller:", error)

      if ((error as Error).message === "File not found in S3") {
        res.status(404).json({ message: (error as Error).message })
      } else {
        res.status(500).json({ message: "Internal server error" })
      }
    }
  }

  async getUserFiles(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Authentication required" })
        return
      }

      const files = await s3Service.getUserFiles(req.user.userId)

      res.status(200).json({ files })
    } catch (error) {
      console.error("Error in getUserFiles controller:", error)
      res.status(500).json({ message: "Internal server error" })
    }
  }

  async getDownloadUrl(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Authentication required" })
        return
      }

      const { fileId } = req.params

      if (!fileId) {
        res.status(400).json({ message: "File ID is required" })
        return
      }

      const downloadUrl = await s3Service.generateDownloadUrl(fileId, req.user.userId)

      res.status(200).json({ downloadUrl })
    } catch (error) {
      console.error("Error in getDownloadUrl controller:", error)

      if ((error as Error).message === "File not found" || (error as Error).message === "Access denied") {
        res.status(404).json({ message: (error as Error).message })
      } else {
        res.status(500).json({ message: "Internal server error" })
      }
    }
  }

  async deleteFile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Authentication required" })
        return
      }

      const { fileId } = req.params

      if (!fileId) {
        res.status(400).json({ message: "File ID is required" })
        return
      }

      await s3Service.deleteFile(fileId, req.user.userId)

      res.status(200).json({ message: "File deleted successfully" })
    } catch (error) {
      console.error("Error in deleteFile controller:", error)

      if ((error as Error).message === "File not found" || (error as Error).message === "Access denied") {
        res.status(404).json({ message: (error as Error).message })
      } else {
        res.status(500).json({ message: "Internal server error" })
      }
    }
  }
}

export default new FileController()
