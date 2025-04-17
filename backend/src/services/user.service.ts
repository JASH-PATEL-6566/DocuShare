import { dynamoDbHelpers, TABLES } from "../config/dynamodb";
import type { User, UserResponse, UserUpdateInput } from "../models/user.model";
import { hashPassword } from "../utils/hash";

export class UserService {
  async updateUser(
    userId: string,
    input: UserUpdateInput
  ): Promise<UserResponse> {
    try {
      // Get current user
      const user = (await dynamoDbHelpers.getItem(TABLES.USERS, {
        userId,
      })) as User;

      if (!user) {
        throw new Error("User not found");
      }

      // Build update expression and attribute values
      let updateExpression = "SET updatedAt = :updatedAt";
      const expressionAttributeValues: Record<string, any> = {
        ":updatedAt": new Date().toISOString(),
      };

      if (input.email) {
        updateExpression += ", email = :email";
        expressionAttributeValues[":email"] = input.email;
      }

      if (input.password) {
        updateExpression += ", passwordHash = :passwordHash";
        expressionAttributeValues[":passwordHash"] = await hashPassword(
          input.password
        );
      }

      if (input.subscriptionId) {
        updateExpression += ", subscriptionId = :subscriptionId";
        expressionAttributeValues[":subscriptionId"] = input.subscriptionId;
      }

      if (input.subscriptionExpiry) {
        updateExpression += ", subscriptionExpiry = :subscriptionExpiry";
        expressionAttributeValues[":subscriptionExpiry"] =
          input.subscriptionExpiry;
      }

      // Update user in DynamoDB
      const updatedUser = (await dynamoDbHelpers.updateItem(
        TABLES.USERS,
        { userId },
        updateExpression,
        expressionAttributeValues
      )) as User;

      // Return updated user data (without password)
      const userResponse: UserResponse = {
        userId: updatedUser.userId,
        email: updatedUser.email,
        subscriptionId: updatedUser.subscriptionId,
        subscriptionExpiry: updatedUser.subscriptionExpiry,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      };

      return userResponse;
    } catch (error) {
      console.error("Error in updateUser service:", error);
      throw error;
    }
  }

  async deleteUser(userId: string): Promise<boolean> {
    try {
      // Delete user from DynamoDB
      await dynamoDbHelpers.deleteItem(TABLES.USERS, { userId });

      return true;
    } catch (error) {
      console.error("Error in deleteUser service:", error);
      throw error;
    }
  }
}

export default new UserService();
