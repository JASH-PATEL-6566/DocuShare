import type { Request, Response } from "express";
import accessLogService from "../services/access-logs.service";
import type { AccessLogsQueryParams } from "../models/access-log.model";

export class AccessLogController {
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

      console.log(result);

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

export default new AccessLogController();
