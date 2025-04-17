import type { Request, Response } from "express";
import accessService from "../services/access.service";
import accessLogService from "../services/access-logs.service";
import type { AccessGrantCreateInput } from "../models/access.model";
import type { AccessLogsQueryParams } from "../models/access-log.model";

export class AccessController {
  async createAccessGrant(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Authentication required" });
        return;
      }

      const { linkId, recipientEmail, recipientIdentifier } = req.body;

      if (!linkId) {
        res.status(400).json({ message: "Link ID is required" });
        return;
      }

      if (!recipientEmail && !recipientIdentifier) {
        res
          .status(400)
          .json({ message: "Recipient email or identifier is required" });
        return;
      }

      const input: AccessGrantCreateInput = {
        linkId,
        recipientEmail,
        recipientIdentifier,
      };

      const accessGrant = await accessService.createAccessGrant(
        req.user.userId,
        input
      );

      res.status(201).json(accessGrant);
    } catch (error) {
      console.error("Error in createAccessGrant controller:", error);

      if (
        (error as Error).message === "Link not found" ||
        (error as Error).message === "Access denied"
      ) {
        res.status(404).json({ message: (error as Error).message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  }

  async revokeAccessGrant(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Authentication required" });
        return;
      }

      const { grantId } = req.params;

      if (!grantId) {
        res.status(400).json({ message: "Grant ID is required" });
        return;
      }

      await accessService.revokeAccessGrant(req.user.userId, grantId);

      res.status(200).json({ message: "Access grant revoked successfully" });
    } catch (error) {
      console.error("Error in revokeAccessGrant controller:", error);

      if (
        (error as Error).message === "Access grant not found" ||
        (error as Error).message === "Link not found" ||
        (error as Error).message === "Access denied"
      ) {
        res.status(404).json({ message: (error as Error).message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  }

  async getLinkAccessGrants(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Authentication required" });
        return;
      }

      const { linkId } = req.params;

      if (!linkId) {
        res.status(400).json({ message: "Link ID is required" });
        return;
      }

      const accessGrants = await accessService.getLinkAccessGrants(
        req.user.userId,
        linkId
      );

      res.status(200).json({ accessGrants });
    } catch (error) {
      console.error("Error in getLinkAccessGrants controller:", error);

      if (
        (error as Error).message === "Link not found" ||
        (error as Error).message === "Access denied"
      ) {
        res.status(404).json({ message: (error as Error).message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  }
  async getAccessLogs(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          error: true,
          message: "Authentication required",
          code: "UNAUTHORIZED",
        });
        return;
      }

      const queryParams: AccessLogsQueryParams = {
        linkId: req.query.linkId as string | undefined,
        action: req.query.action as "view" | "download" | undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        limit: req.query.limit
          ? Number.parseInt(req.query.limit as string)
          : 100,
        offset: req.query.offset
          ? Number.parseInt(req.query.offset as string)
          : 0,
      };

      // Validate action if provided
      if (
        queryParams.action &&
        !["view", "download"].includes(queryParams.action)
      ) {
        res.status(400).json({
          error: true,
          message: "Invalid action parameter. Must be 'view' or 'download'",
          code: "INVALID_PARAMETER",
        });
        return;
      }

      // Validate dates if provided
      if (queryParams.startDate && isNaN(Date.parse(queryParams.startDate))) {
        res.status(400).json({
          error: true,
          message:
            "Invalid startDate format. Use ISO format (YYYY-MM-DDTHH:MM:SSZ)",
          code: "INVALID_PARAMETER",
        });
        return;
      }

      if (queryParams.endDate && isNaN(Date.parse(queryParams.endDate))) {
        res.status(400).json({
          error: true,
          message:
            "Invalid endDate format. Use ISO format (YYYY-MM-DDTHH:MM:SSZ)",
          code: "INVALID_PARAMETER",
        });
        return;
      }

      const result = await accessLogService.getAccessLogs(
        req.user.userId,
        queryParams
      );
      

      res.status(200).json(result);
    } catch (error) {
      console.error("Error in getAccessLogs controller:", error);

      if ((error as Error).message === "Access denied") {
        res.status(403).json({
          error: true,
          message: "You don't have permission to access these logs",
          code: "FORBIDDEN",
        });
      } else {
        res.status(500).json({
          error: true,
          message: "Internal server error",
          code: "SERVER_ERROR",
        });
      }
    }
  }

  async getAccessLogStats(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          error: true,
          message: "Authentication required",
          code: "UNAUTHORIZED",
        });
        return;
      }

      const queryParams: AccessLogsQueryParams = {
        linkId: req.query.linkId as string | undefined,
        action: req.query.action as "view" | "download" | undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
      };

      // Validate action if provided
      if (
        queryParams.action &&
        !["view", "download"].includes(queryParams.action)
      ) {
        res.status(400).json({
          error: true,
          message: "Invalid action parameter. Must be 'view' or 'download'",
          code: "INVALID_PARAMETER",
        });
        return;
      }

      // Validate dates if provided
      if (queryParams.startDate && isNaN(Date.parse(queryParams.startDate))) {
        res.status(400).json({
          error: true,
          message:
            "Invalid startDate format. Use ISO format (YYYY-MM-DDTHH:MM:SSZ)",
          code: "INVALID_PARAMETER",
        });
        return;
      }

      if (queryParams.endDate && isNaN(Date.parse(queryParams.endDate))) {
        res.status(400).json({
          error: true,
          message:
            "Invalid endDate format. Use ISO format (YYYY-MM-DDTHH:MM:SSZ)",
          code: "INVALID_PARAMETER",
        });
        return;
      }

      const stats = await accessLogService.getAccessLogStats(
        req.user.userId,
        queryParams
      );
      res.status(200).json(stats);
    } catch (error) {
      console.error("Error in getAccessLogStats controller:", error);

      if ((error as Error).message === "Access denied") {
        res.status(403).json({
          error: true,
          message: "You don't have permission to access these statistics",
          code: "FORBIDDEN",
        });
      } else {
        res.status(500).json({
          error: true,
          message: "Internal server error",
          code: "SERVER_ERROR",
        });
      }
    }
  }
}

export default new AccessController();
