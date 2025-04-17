import { dynamoDbHelpers, TABLES } from "../config/dynamodb";
import { s3Helpers } from "../config/s3";
import { comparePassword } from "../utils/hash";
import { v4 as uuidv4 } from "uuid";

interface TrackingInfo {
  ipAddress: string;
  userAgent: string;
  isDownload?: boolean;
}

interface LinkInfoResponse {
  fileName: string;
  fileType: string;
  fileSize: number;
  expiryTimestamp: string | null;
  status: string;
  requiresPassword: boolean;
  allowDownload: boolean;
  viewLimit: number | null;
  viewsSoFar: number;
  downloadLimit: number | null;
  downloadsSoFar: number;
}

interface FileContentResponse {
  viewUrl: string;
  downloadUrl?: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  allowDownload: boolean;
}

interface PasswordVerificationResponse {
  success: boolean;
  viewUrl?: string;
  downloadUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  allowDownload?: boolean;
}

export class PublicService {
  async getLinkInfo(
    linkId: string,
    trackingInfo: TrackingInfo
  ): Promise<LinkInfoResponse> {
    try {
      // Get link from DynamoDB
      const link = await dynamoDbHelpers.getItem(TABLES.LINKS, { linkId });

      if (!link) {
        throw new Error("Link not found");
      }

      // Check if link has been revoked
      if (link.status === "revoked") {
        throw new Error("Link has been revoked");
      }

      // Check if link has expired
      if (link.expiryTimestamp && new Date(link.expiryTimestamp) < new Date()) {
        throw new Error("Link has expired");
      }

      // Check if view limit has been reached
      if (link.viewLimit !== null && link.viewsSoFar >= link.viewLimit) {
        throw new Error("View limit reached");
      }

      // Get file information
      const file = await dynamoDbHelpers.getItem(TABLES.FILES, {
        fileId: link.fileId,
      });

      if (!file) {
        throw new Error("File not found");
      }

      // Create access log
      const logId = uuidv4();
      const now = new Date().toISOString();

      const accessLog = {
        logId,
        linkId,
        userId: link.userId,
        ipAddress: trackingInfo.ipAddress,
        userAgent: trackingInfo.userAgent,
        accessTime: now,
        action: "view",
      };

      // Update link with access log and increment view count
      await dynamoDbHelpers.updateItem(
        TABLES.LINKS,
        { linkId },
        "SET viewsSoFar = viewsSoFar + :inc, accessLogs = list_append(if_not_exists(accessLogs, :empty_list), :log), updatedAt = :now",
        {
          ":inc": 1,
          ":log": [accessLog],
          ":empty_list": [],
          ":now": now,
        }
      );

      // Save access log to DynamoDB
      await dynamoDbHelpers.putItem(TABLES.ACCESS_LOGS, accessLog);

      // Return link info
      return {
        fileName: file.fileName,
        fileType: file.fileType,
        fileSize: file.fileSize,
        expiryTimestamp: link.expiryTimestamp || null,
        status: link.status || "active",
        requiresPassword: !!link.passwordHash,
        allowDownload: link.allowDownload,
        viewLimit: link.viewLimit,
        viewsSoFar: link.viewsSoFar + 1, // Include the current view
        downloadLimit: link.downloadLimit,
        downloadsSoFar: link.downloadsSoFar,
      };
    } catch (error) {
      console.error("Error in getLinkInfo service:", error);
      throw error;
    }
  }

  async getFileContent(
    linkId: string,
    trackingInfo: TrackingInfo
  ): Promise<FileContentResponse> {
    try {
      // Get link from DynamoDB
      const link = await dynamoDbHelpers.getItem(TABLES.LINKS, { linkId });

      if (!link) {
        throw new Error("Link not found");
      }

      // Check if link has been revoked
      if (link.status === "revoked") {
        throw new Error("Link has been revoked");
      }

      // Check if link has expired
      if (link.expiryTimestamp && new Date(link.expiryTimestamp) < new Date()) {
        throw new Error("Link has expired");
      }

      // Check if view limit has been reached
      if (link.viewLimit !== null && link.viewsSoFar >= link.viewLimit) {
        throw new Error("View limit reached");
      }

      // Check if password is required
      if (link.passwordHash) {
        throw new Error("Password required");
      }

      // If this is a download request, check download permissions and limits
      if (trackingInfo.isDownload) {
        if (!link.allowDownload) {
          throw new Error("Download not allowed");
        }

        if (
          link.downloadLimit !== null &&
          link.downloadsSoFar >= link.downloadLimit
        ) {
          throw new Error("Download limit reached");
        }
      }

      // Get file information
      const file = await dynamoDbHelpers.getItem(TABLES.FILES, {
        fileId: link.fileId,
      });

      if (!file) {
        throw new Error("File not found");
      }

      // Generate signed URLs
      const viewUrl = await s3Helpers.getSignedDownloadUrl(
        file.s3Url,
        15 * 60,
        true
      ); // 15 minutes, inline

      // Only generate download URL if allowed
      let downloadUrl;
      if (link.allowDownload) {
        downloadUrl = await s3Helpers.getSignedDownloadUrl(
          file.s3Url,
          15 * 60,
          false
        ); // 15 minutes, attachment
      }

      // Create access log
      const logId = uuidv4();
      const now = new Date().toISOString();

      const accessLog = {
        logId,
        linkId,
        userId: link.userId,
        ipAddress: trackingInfo.ipAddress,
        userAgent: trackingInfo.userAgent,
        accessTime: now,
        action: trackingInfo.isDownload ? "download" : "view",
      };

      // Update link with access log and increment view/download count
      if (trackingInfo.isDownload) {
        await dynamoDbHelpers.updateItem(
          TABLES.LINKS,
          { linkId },
          "SET downloadsSoFar = downloadsSoFar + :inc, accessLogs = list_append(if_not_exists(accessLogs, :empty_list), :log), updatedAt = :now",
          {
            ":inc": 1,
            ":log": [accessLog],
            ":empty_list": [],
            ":now": now,
          }
        );
      } else {
        await dynamoDbHelpers.updateItem(
          TABLES.LINKS,
          { linkId },
          "SET viewsSoFar = viewsSoFar + :inc, accessLogs = list_append(if_not_exists(accessLogs, :empty_list), :log), updatedAt = :now",
          {
            ":inc": 1,
            ":log": [accessLog],
            ":empty_list": [],
            ":now": now,
          }
        );
      }

      // Save access log to DynamoDB
      await dynamoDbHelpers.putItem(TABLES.ACCESS_LOGS, accessLog);

      return {
        viewUrl,
        downloadUrl,
        fileName: file.fileName,
        fileType: file.fileType,
        fileSize: file.fileSize,
        allowDownload: link.allowDownload,
      };
    } catch (error) {
      console.error("Error in getFileContent service:", error);
      throw error;
    }
  }

  async verifyPassword(
    linkId: string,
    password: string,
    trackingInfo: TrackingInfo
  ): Promise<PasswordVerificationResponse> {
    try {
      // Get link from DynamoDB
      const link = await dynamoDbHelpers.getItem(TABLES.LINKS, { linkId });

      if (!link) {
        throw new Error("Link not found");
      }

      // Check if link has been revoked
      if (link.status === "revoked") {
        throw new Error("Link has been revoked");
      }

      // Check if link has expired
      if (link.expiryTimestamp && new Date(link.expiryTimestamp) < new Date()) {
        throw new Error("Link has expired");
      }

      // Check if view limit has been reached
      if (link.viewLimit !== null && link.viewsSoFar >= link.viewLimit) {
        throw new Error("View limit reached");
      }

      // Verify password
      if (!link.passwordHash) {
        // No password required, but we'll still return success
        return { success: true };
      }

      const isPasswordValid = await comparePassword(
        password,
        link.passwordHash
      );

      if (!isPasswordValid) {
        throw new Error("Invalid password");
      }

      // Get file information
      const file = await dynamoDbHelpers.getItem(TABLES.FILES, {
        fileId: link.fileId,
      });

      if (!file) {
        throw new Error("File not found");
      }

      // Generate signed URLs
      const viewUrl = await s3Helpers.getSignedDownloadUrl(
        file.s3Url,
        15 * 60,
        true
      ); // 15 minutes, inline

      // Only generate download URL if allowed
      let downloadUrl;
      if (link.allowDownload) {
        downloadUrl = await s3Helpers.getSignedDownloadUrl(
          file.s3Url,
          15 * 60,
          false
        ); // 15 minutes, attachment
      }

      // Create access log
      const logId = uuidv4();
      const now = new Date().toISOString();

      const accessLog = {
        logId,
        linkId,
        userId: link.userId,
        ipAddress: trackingInfo.ipAddress,
        userAgent: trackingInfo.userAgent,
        accessTime: now,
        action: "view",
      };

      // Update link with access log and increment view count
      await dynamoDbHelpers.updateItem(
        TABLES.LINKS,
        { linkId },
        "SET viewsSoFar = viewsSoFar + :inc, accessLogs = list_append(if_not_exists(accessLogs, :empty_list), :log), updatedAt = :now",
        {
          ":inc": 1,
          ":log": [accessLog],
          ":empty_list": [],
          ":now": now,
        }
      );

      // Save access log to DynamoDB
      await dynamoDbHelpers.putItem(TABLES.ACCESS_LOGS, accessLog);

      return {
        success: true,
        viewUrl,
        downloadUrl,
        fileName: file.fileName,
        fileType: file.fileType,
        fileSize: file.fileSize,
        allowDownload: link.allowDownload,
      };
    } catch (error) {
      console.error("Error in verifyPassword service:", error);

      if ((error as Error).message === "Invalid password") {
        return { success: false };
      }

      throw error;
    }
  }
}

export default new PublicService();
