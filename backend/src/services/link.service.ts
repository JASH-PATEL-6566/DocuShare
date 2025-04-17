import { v4 as uuidv4 } from "uuid";
import { dynamoDbHelpers, TABLES } from "../config/dynamodb";
import { hashPassword } from "../utils/hash";
import type { LinkCreateInput, LinkResponse } from "../models/file.model";

export class LinkService {
  async createLink(
    userId: string,
    input: LinkCreateInput
  ): Promise<LinkResponse> {
    try {
      // Check if file exists and belongs to the user
      const file = await dynamoDbHelpers.getItem(TABLES.FILES, {
        fileId: input.fileId,
      });

      if (!file) {
        throw new Error("File not found");
      }

      if (file.userId !== userId) {
        throw new Error("Access denied");
      }

      // Calculate expiry timestamp
      const now = new Date();
      let expiryTimestamp = "";

      if (input.expiryIn) {
        const expiryMatch = input.expiryIn.match(/^(\d+)([hd])$/);

        if (expiryMatch) {
          const [, value, unit] = expiryMatch;
          const expiryDate = new Date(now);

          if (unit === "h") {
            expiryDate.setHours(expiryDate.getHours() + Number.parseInt(value));
          } else if (unit === "d") {
            expiryDate.setDate(expiryDate.getDate() + Number.parseInt(value));
          }

          expiryTimestamp = expiryDate.toISOString();
        } else {
          throw new Error(
            "Invalid expiry format. Use format like '12h' or '7d'"
          );
        }
      } else {
        // Default expiry: 7 days
        const expiryDate = new Date(now);
        expiryDate.setDate(expiryDate.getDate() + 7);
        expiryTimestamp = expiryDate.toISOString();
      }

      // Hash password if provided
      let passwordHash = "";
      if (input.password) {
        passwordHash = await hashPassword(input.password);
      }

      // Generate a unique link ID
      const linkId = uuidv4();

      // Create link record
      const link = {
        linkId,
        fileId: input.fileId,
        userId,
        expiryTimestamp,
        passwordHash,
        downloadLimit: input.downloadLimit || null,
        downloadsSoFar: 0,
        viewLimit: input.viewLimit || null,
        viewsSoFar: 0,
        allowDownload:
          input.allowDownload !== undefined ? input.allowDownload : true,
        requireIdentification: input.requireIdentification || false,
        status: "active", // Default status is active
        accessLogs: [],
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };

      // Save link to DynamoDB
      await dynamoDbHelpers.putItem(TABLES.LINKS, link);

      // Generate shareable link
      const shareableLink = `${process.env.API_URL}/access/${linkId}`;

      return {
        linkId,
        shareableLink,
        expiryTimestamp,
        hasPassword: !!passwordHash,
        downloadLimit: input.downloadLimit,
        viewLimit: input.viewLimit,
        allowDownload: input.allowDownload,
        status: "active",
        requireIdentification: input.requireIdentification || false,
        createdAt: now.toISOString(),
      };
    } catch (error) {
      console.error("Error creating link:", error);
      throw error;
    }
  }

  async getUserLinks(userId: string): Promise<LinkResponse[]> {
    try {
      // Get all links for the user
      const links =
        (await dynamoDbHelpers.scan(TABLES.LINKS, "userId = :userId", {
          ":userId": userId,
        })) ?? [];

      // Map to response format
      return links.map((link) => ({
        linkId: link.linkId,
        shareableLink: `${process.env.API_URL}/access/${link.linkId}`,
        expiryTimestamp: link.expiryTimestamp,
        hasPassword: !!link.passwordHash,
        downloadLimit: link.downloadLimit,
        viewLimit: link.viewLimit,
        allowDownload: link.allowDownload,
        status: link.status || "active",
        requireIdentification: link.requireIdentification || false,
        createdAt: link.createdAt,
      }));
    } catch (error) {
      console.error("Error getting user links:", error);
      throw error;
    }
  }

  async getLinkById(userId: string, linkId: string): Promise<LinkResponse> {
    try {
      // Get link
      const link = await dynamoDbHelpers.getItem(TABLES.LINKS, { linkId });

      if (!link) {
        throw new Error("Link not found");
      }

      if (link.userId !== userId) {
        throw new Error("Access denied");
      }

      // Return link response
      return {
        linkId: link.linkId,
        shareableLink: `${process.env.API_URL}/access/${link.linkId}`,
        expiryTimestamp: link.expiryTimestamp,
        hasPassword: !!link.passwordHash,
        downloadLimit: link.downloadLimit,
        viewLimit: link.viewLimit,
        allowDownload: link.allowDownload,
        status: link.status || "active",
        requireIdentification: link.requireIdentification || false,
        createdAt: link.createdAt,
      };
    } catch (error) {
      console.error("Error getting link by ID:", error);
      throw error;
    }
  }

  async updateLink(
    userId: string,
    linkId: string,
    updates: Partial<LinkCreateInput>
  ): Promise<LinkResponse> {
    try {
      // Check if link exists and belongs to the user
      const link = await dynamoDbHelpers.getItem(TABLES.LINKS, { linkId });

      if (!link) {
        throw new Error("Link not found");
      }

      if (link.userId !== userId) {
        throw new Error("Access denied");
      }

      // Build update expression
      let updateExpression = "SET updatedAt = :updatedAt";
      const expressionAttributeValues: Record<string, any> = {
        ":updatedAt": new Date().toISOString(),
      };
      const expressionAttributeNames: Record<string, string> = {};

      // Update expiry if provided
      if (updates.expiryIn) {
        const expiryMatch = updates.expiryIn.match(/^(\d+)([hd])$/);

        if (expiryMatch) {
          const [, value, unit] = expiryMatch;
          const now = new Date();
          const expiryDate = new Date(now);

          if (unit === "h") {
            expiryDate.setHours(expiryDate.getHours() + Number.parseInt(value));
          } else if (unit === "d") {
            expiryDate.setDate(expiryDate.getDate() + Number.parseInt(value));
          }

          updateExpression += ", expiryTimestamp = :expiryTimestamp";
          expressionAttributeValues[":expiryTimestamp"] =
            expiryDate.toISOString();
        } else {
          throw new Error(
            "Invalid expiry format. Use format like '12h' or '7d'"
          );
        }
      }

      // Update password if provided
      if (updates.password) {
        const passwordHash = await hashPassword(updates.password);
        updateExpression += ", passwordHash = :passwordHash";
        expressionAttributeValues[":passwordHash"] = passwordHash;
      }

      // Update download limit if provided
      if (updates.downloadLimit !== undefined) {
        updateExpression += ", downloadLimit = :downloadLimit";
        expressionAttributeValues[":downloadLimit"] =
          updates.downloadLimit || null;
      }

      // Update view limit if provided
      if (updates.viewLimit !== undefined) {
        updateExpression += ", viewLimit = :viewLimit";
        expressionAttributeValues[":viewLimit"] = updates.viewLimit || null;
      }

      // Update allow download if provided
      if (updates.allowDownload !== undefined) {
        updateExpression += ", allowDownload = :allowDownload";
        expressionAttributeValues[":allowDownload"] = updates.allowDownload;
      }

      // Update require identification if provided
      if (updates.requireIdentification !== undefined) {
        updateExpression += ", requireIdentification = :requireIdentification";
        expressionAttributeValues[":requireIdentification"] =
          updates.requireIdentification;
      }

      // Update link in DynamoDB
      const updatedLink = await dynamoDbHelpers.updateItem(
        TABLES.LINKS,
        { linkId },
        updateExpression,
        expressionAttributeValues,
        expressionAttributeNames
      );

      // Return updated link
      return {
        linkId: updatedLink?.linkId,
        shareableLink: `${process.env.API_URL}/access/${updatedLink?.linkId}`,
        expiryTimestamp: updatedLink?.expiryTimestamp,
        hasPassword: !!updatedLink?.passwordHash,
        downloadLimit: updatedLink?.downloadLimit,
        viewLimit: updatedLink?.viewLimit,
        allowDownload: updatedLink?.allowDownload,
        status: updatedLink?.status || "active",
        requireIdentification: updatedLink?.requireIdentification || false,
        createdAt: updatedLink?.createdAt,
      };
    } catch (error) {
      console.error("Error updating link:", error);
      throw error;
    }
  }

  async revokeLink(userId: string, linkId: string): Promise<boolean> {
    try {
      // Check if link exists and belongs to the user
      const link = await dynamoDbHelpers.getItem(TABLES.LINKS, { linkId });

      if (!link) {
        throw new Error("Link not found");
      }

      if (link.userId !== userId) {
        throw new Error("Access denied");
      }

      // Update link status to revoked
      await dynamoDbHelpers.updateItem(
        TABLES.LINKS,
        { linkId },
        "SET #status = :status, updatedAt = :updatedAt",
        {
          ":status": "revoked",
          ":updatedAt": new Date().toISOString(),
        },
        {
          "#status": "status",
        }
      );

      return true;
    } catch (error) {
      console.error("Error revoking link:", error);
      throw error;
    }
  }

  async activateLink(userId: string, linkId: string): Promise<boolean> {
    try {
      // Check if link exists and belongs to the user
      const link = await dynamoDbHelpers.getItem(TABLES.LINKS, { linkId });

      if (!link) {
        throw new Error("Link not found");
      }

      if (link.userId !== userId) {
        throw new Error("Access denied");
      }

      // Update link status to active
      await dynamoDbHelpers.updateItem(
        TABLES.LINKS,
        { linkId },
        "SET #status = :status, updatedAt = :updatedAt",
        {
          ":status": "active",
          ":updatedAt": new Date().toISOString(),
        },
        {
          "#status": "status",
        }
      );

      return true;
    } catch (error) {
      console.error("Error activating link:", error);
      throw error;
    }
  }

  async deleteLink(userId: string, linkId: string): Promise<boolean> {
    try {
      // Check if link exists and belongs to the user
      const link = await dynamoDbHelpers.getItem(TABLES.LINKS, { linkId });

      if (!link) {
        throw new Error("Link not found");
      }

      if (link.userId !== userId) {
        throw new Error("Access denied");
      }

      // Delete link
      await dynamoDbHelpers.deleteItem(TABLES.LINKS, { linkId });

      return true;
    } catch (error) {
      console.error("Error deleting link:", error);
      throw error;
    }
  }
}

export default new LinkService();
