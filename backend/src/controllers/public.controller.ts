import type { Request, Response } from "express";
import publicService from "../services/public.service";

export class PublicController {
  async getLinkInfo(req: Request, res: Response): Promise<void> {
    try {
      const { linkId } = req.params;

      if (!linkId) {
        res.status(400).json({ message: "Link ID is required" });
        return;
      }

      // Get client IP for tracking
      const clientIp =
        req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
      const userAgent = req.headers["user-agent"] || "unknown";

      const linkInfo = await publicService.getLinkInfo(linkId, {
        ipAddress: clientIp as string,
        userAgent: userAgent as string,
      });

      res.status(200).json(linkInfo);
    } catch (error) {
      console.error("Error in getLinkInfo controller:", error);

      if ((error as Error).message === "Link not found") {
        res.status(404).json({ message: "Link not found or has expired" });
      } else if ((error as Error).message === "Link has been revoked") {
        res
          .status(403)
          .json({ message: "This link has been revoked by the owner" });
      } else if ((error as Error).message === "Link has expired") {
        res.status(410).json({ message: "This link has expired" });
      } else if ((error as Error).message === "View limit reached") {
        res
          .status(410)
          .json({ message: "View limit for this link has been reached" });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  }

  async getFileContent(req: Request, res: Response): Promise<void> {
    try {
      const { linkId } = req.params;

      if (!linkId) {
        res.status(400).json({ message: "Link ID is required" });
        return;
      }

      // Get client IP for tracking
      const clientIp =
        req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
      const userAgent = req.headers["user-agent"] || "unknown";

      // Check if this is a download request
      const isDownload = req.query.download === "true";

      const fileContent = await publicService.getFileContent(linkId, {
        ipAddress: clientIp as string,
        userAgent: userAgent as string,
        isDownload,
      });

      //   console.log(fileContent);

      res.status(200).json(fileContent);
    } catch (error) {
      console.error("Error in getFileContent controller:", error);

      if ((error as Error).message === "Link not found") {
        res.status(404).json({ message: "Link not found or has expired" });
      } else if ((error as Error).message === "Link has been revoked") {
        res
          .status(403)
          .json({ message: "This link has been revoked by the owner" });
      } else if ((error as Error).message === "Link has expired") {
        res.status(410).json({ message: "This link has expired" });
      } else if ((error as Error).message === "Password required") {
        res.status(401).json({
          message: "This file is password protected",
          requiresPassword: true,
        });
      } else if ((error as Error).message === "Download not allowed") {
        res
          .status(403)
          .json({ message: "Download is not allowed for this file" });
      } else if ((error as Error).message === "Download limit reached") {
        res
          .status(410)
          .json({ message: "Download limit for this link has been reached" });
      } else if ((error as Error).message === "View limit reached") {
        res
          .status(410)
          .json({ message: "View limit for this link has been reached" });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  }

  async verifyPassword(req: Request, res: Response): Promise<void> {
    try {
      const { linkId } = req.params;
      const { password } = req.body;
      console.log(password);

      if (!linkId) {
        res.status(400).json({ message: "Link ID is required" });
        return;
      }

      if (!password) {
        res.status(400).json({ message: "Password is required" });
        return;
      }

      // Get client IP for tracking
      const clientIp =
        req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
      const userAgent = req.headers["user-agent"] || "unknown";

      const result = await publicService.verifyPassword(linkId, password, {
        ipAddress: clientIp as string,
        userAgent: userAgent as string,
      });

      res.status(200).json(result);
    } catch (error) {
      console.error("Error in verifyPassword controller:", error);

      if ((error as Error).message === "Link not found") {
        res.status(404).json({ message: "Link not found or has expired" });
      } else if ((error as Error).message === "Link has been revoked") {
        res
          .status(403)
          .json({ message: "This link has been revoked by the owner" });
      } else if ((error as Error).message === "Link has expired") {
        res.status(410).json({ message: "This link has expired" });
      } else if ((error as Error).message === "Invalid password") {
        res
          .status(401)
          .json({ message: "Invalid password", requiresPassword: true });
      } else if ((error as Error).message === "View limit reached") {
        res
          .status(410)
          .json({ message: "View limit for this link has been reached" });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  }
}

export default new PublicController();
