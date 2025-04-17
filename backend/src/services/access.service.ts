import { v4 as uuidv4 } from "uuid";
import { dynamoDbHelpers, TABLES } from "../config/dynamodb";
import type {
  AccessGrant,
  AccessGrantCreateInput,
  AccessGrantResponse,
} from "../models/access.model";

export class AccessService {
  // Create a new access grant for a link
  async createAccessGrant(
    userId: string,
    input: AccessGrantCreateInput
  ): Promise<AccessGrantResponse> {
    try {
      // Check if link exists and belongs to the user
      const link = await dynamoDbHelpers.getItem(TABLES.LINKS, {
        linkId: input.linkId,
      });

      if (!link) {
        throw new Error("Link not found");
      }

      if (link.userId !== userId) {
        throw new Error("Access denied");
      }

      const now = new Date().toISOString();
      const grantId = uuidv4();

      // Create access grant
      const accessGrant: AccessGrant = {
        grantId,
        linkId: input.linkId,
        recipientEmail: input.recipientEmail,
        recipientIdentifier: input.recipientIdentifier,
        status: "active",
        createdAt: now,
        updatedAt: now,
        accessCount: 0,
      };

      // Save to DynamoDB
      await dynamoDbHelpers.putItem(TABLES.ACCESS_GRANTS, accessGrant);

      return {
        grantId: accessGrant.grantId,
        linkId: accessGrant.linkId,
        recipientEmail: accessGrant.recipientEmail,
        recipientIdentifier: accessGrant.recipientIdentifier,
        status: accessGrant.status,
        createdAt: accessGrant.createdAt,
        lastAccessedAt: accessGrant.lastAccessedAt,
        accessCount: accessGrant.accessCount,
      };
    } catch (error) {
      console.error("Error creating access grant:", error);
      throw error;
    }
  }

  // Revoke a specific access grant
  async revokeAccessGrant(userId: string, grantId: string): Promise<boolean> {
    try {
      // Get the access grant
      const accessGrant = await dynamoDbHelpers.getItem(TABLES.ACCESS_GRANTS, {
        grantId,
      });

      if (!accessGrant) {
        throw new Error("Access grant not found");
      }

      // Get the link to check ownership
      const link = await dynamoDbHelpers.getItem(TABLES.LINKS, {
        linkId: accessGrant.linkId,
      });

      if (!link) {
        throw new Error("Link not found");
      }

      if (link.userId !== userId) {
        throw new Error("Access denied");
      }

      // Update the access grant status
      const now = new Date().toISOString();
      await dynamoDbHelpers.updateItem(
        TABLES.ACCESS_GRANTS,
        { grantId },
        "SET #status = :status, updatedAt = :updatedAt, revokedAt = :revokedAt",
        {
          ":status": "revoked",
          ":updatedAt": now,
          ":revokedAt": now,
        },
        {
          "#status": "status",
        }
      );

      return true;
    } catch (error) {
      console.error("Error revoking access grant:", error);
      throw error;
    }
  }

  // Get all access grants for a link
  async getLinkAccessGrants(
    userId: string,
    linkId: string
  ): Promise<AccessGrantResponse[]> {
    try {
      // Check if link exists and belongs to the user
      const link = await dynamoDbHelpers.getItem(TABLES.LINKS, { linkId });

      if (!link) {
        throw new Error("Link not found");
      }

      if (link.userId !== userId) {
        throw new Error("Access denied");
      }

      // Get all access grants for the link
      const accessGrants =
        (await dynamoDbHelpers.scan(TABLES.ACCESS_GRANTS, "linkId = :linkId", {
          ":linkId": linkId,
        })) || [];

      if (!accessGrants) {
        throw new Error("No access grants found");
      }

      // Map to response format
      return accessGrants.map((grant) => ({
        grantId: grant.grantId,
        linkId: grant.linkId,
        recipientEmail: grant.recipientEmail,
        recipientIdentifier: grant.recipientIdentifier,
        status: grant.status,
        createdAt: grant.createdAt,
        lastAccessedAt: grant.lastAccessedAt,
        accessCount: grant.accessCount,
      }));
    } catch (error) {
      console.error("Error getting link access grants:", error);
      throw error;
    }
  }

  // Check if an access grant is valid
  async validateAccessGrant(grantId: string, linkId: string): Promise<boolean> {
    try {
      // Get the access grant
      const accessGrant = await dynamoDbHelpers.getItem(TABLES.ACCESS_GRANTS, {
        grantId,
      });

      if (!accessGrant) {
        return false;
      }

      if (accessGrant.linkId !== linkId) {
        return false;
      }

      if (accessGrant.status !== "active") {
        return false;
      }

      // Update access count and last accessed timestamp
      const now = new Date().toISOString();
      await dynamoDbHelpers.updateItem(
        TABLES.ACCESS_GRANTS,
        { grantId },
        "SET accessCount = accessCount + :inc, lastAccessedAt = :lastAccessedAt, updatedAt = :updatedAt",
        {
          ":inc": 1,
          ":lastAccessedAt": now,
          ":updatedAt": now,
        }
      );

      return true;
    } catch (error) {
      console.error("Error validating access grant:", error);
      return false;
    }
  }
}

export default new AccessService();
