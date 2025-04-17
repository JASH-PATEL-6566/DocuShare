import type { Request, Response } from "express"
import linkService from "../services/link.service"
import type { LinkCreateInput } from "../models/file.model"

export class LinkController {
  async createLink(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Authentication required" })
        return
      }

      const { fileId, expiryIn, password, downloadLimit, viewLimit, allowDownload, requireIdentification } = req.body

      if (!fileId) {
        res.status(400).json({ message: "File ID is required" })
        return
      }

      const linkInput: LinkCreateInput = {
        fileId,
        expiryIn: expiryIn || "7d", // Default: 7 days
        password,
        downloadLimit,
        viewLimit,
        allowDownload: allowDownload !== undefined ? allowDownload : true,
        requireIdentification,
      }

      const link = await linkService.createLink(req.user.userId, linkInput)

      res.status(201).json(link)
    } catch (error) {
      console.error("Error in createLink controller:", error)

      if ((error as Error).message === "File not found" || (error as Error).message === "Access denied") {
        res.status(404).json({ message: (error as Error).message })
      } else if ((error as Error).message.includes("Invalid expiry format")) {
        res.status(400).json({ message: (error as Error).message })
      } else {
        res.status(500).json({ message: "Internal server error" })
      }
    }
  }

  async getUserLinks(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Authentication required" })
        return
      }

      const links = await linkService.getUserLinks(req.user.userId)

      res.status(200).json({ links })
    } catch (error) {
      console.error("Error in getUserLinks controller:", error)
      res.status(500).json({ message: "Internal server error" })
    }
  }

  async getLinkById(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Authentication required" })
        return
      }

      const { linkId } = req.params

      if (!linkId) {
        res.status(400).json({ message: "Link ID is required" })
        return
      }

      const link = await linkService.getLinkById(req.user.userId, linkId)

      res.status(200).json(link)
    } catch (error) {
      console.error("Error in getLinkById controller:", error)

      if ((error as Error).message === "Link not found" || (error as Error).message === "Access denied") {
        res.status(404).json({ message: (error as Error).message })
      } else {
        res.status(500).json({ message: "Internal server error" })
      }
    }
  }

  async updateLink(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Authentication required" })
        return
      }

      const { linkId } = req.params
      const { expiryIn, password, downloadLimit, viewLimit, allowDownload, requireIdentification } = req.body

      if (!linkId) {
        res.status(400).json({ message: "Link ID is required" })
        return
      }

      const updates: Partial<LinkCreateInput> = {}

      if (expiryIn !== undefined) updates.expiryIn = expiryIn
      if (password !== undefined) updates.password = password
      if (downloadLimit !== undefined) updates.downloadLimit = downloadLimit
      if (viewLimit !== undefined) updates.viewLimit = viewLimit
      if (allowDownload !== undefined) updates.allowDownload = allowDownload
      if (requireIdentification !== undefined) updates.requireIdentification = requireIdentification

      const updatedLink = await linkService.updateLink(req.user.userId, linkId, updates)

      res.status(200).json(updatedLink)
    } catch (error) {
      console.error("Error in updateLink controller:", error)

      if ((error as Error).message === "Link not found" || (error as Error).message === "Access denied") {
        res.status(404).json({ message: (error as Error).message })
      } else if ((error as Error).message.includes("Invalid expiry format")) {
        res.status(400).json({ message: (error as Error).message })
      } else {
        res.status(500).json({ message: "Internal server error" })
      }
    }
  }

  async revokeLink(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Authentication required" })
        return
      }

      const { linkId } = req.params

      if (!linkId) {
        res.status(400).json({ message: "Link ID is required" })
        return
      }

      await linkService.revokeLink(req.user.userId, linkId)

      res.status(200).json({ message: "Link revoked successfully" })
    } catch (error) {
      console.error("Error in revokeLink controller:", error)

      if ((error as Error).message === "Link not found" || (error as Error).message === "Access denied") {
        res.status(404).json({ message: (error as Error).message })
      } else {
        res.status(500).json({ message: "Internal server error" })
      }
    }
  }

  async activateLink(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Authentication required" })
        return
      }

      const { linkId } = req.params

      if (!linkId) {
        res.status(400).json({ message: "Link ID is required" })
        return
      }

      await linkService.activateLink(req.user.userId, linkId)

      res.status(200).json({ message: "Link activated successfully" })
    } catch (error) {
      console.error("Error in activateLink controller:", error)

      if ((error as Error).message === "Link not found" || (error as Error).message === "Access denied") {
        res.status(404).json({ message: (error as Error).message })
      } else {
        res.status(500).json({ message: "Internal server error" })
      }
    }
  }

  async deleteLink(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Authentication required" })
        return
      }

      const { linkId } = req.params

      if (!linkId) {
        res.status(400).json({ message: "Link ID is required" })
        return
      }

      await linkService.deleteLink(req.user.userId, linkId)

      res.status(200).json({ message: "Link deleted successfully" })
    } catch (error) {
      console.error("Error in deleteLink controller:", error)

      if ((error as Error).message === "Link not found" || (error as Error).message === "Access denied") {
        res.status(404).json({ message: (error as Error).message })
      } else {
        res.status(500).json({ message: "Internal server error" })
      }
    }
  }
}

export default new LinkController()
