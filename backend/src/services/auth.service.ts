import { v4 as uuidv4 } from "uuid";
import { dynamoDbHelpers, TABLES } from "../config/dynamodb";
import type { UserCreateInput, User, UserResponse } from "../models/user.model";
import { hashPassword, comparePassword } from "../utils/hash";
import { generateToken, type TokenPayload } from "../utils/jwt";

export class AuthService {
  async register(
    input: UserCreateInput
  ): Promise<{ user: UserResponse; token: string }> {
    try {
      // Check if user already exists
      let existingUsers: User[] = [];
      try {
        const result = await dynamoDbHelpers.scan(
          TABLES.USERS,
          "email = :email",
          {
            ":email": input.email,
          }
        );
        existingUsers = result as User[];
      } catch (error) {
        console.error("Error scanning for existing users:", error);
        // If there's an error scanning, we'll assume no existing users and continue
        // This is a fallback for development/testing
      }

      if (existingUsers && existingUsers.length > 0) {
        throw new Error("User with this email already exists");
      }

      // Hash password
      const passwordHash = await hashPassword(input.password);

      // Create user
      const now = new Date().toISOString();
      const userId = uuidv4();

      const user: User = {
        userId,
        email: input.email,
        passwordHash,
        subscriptionId: "free", // Default subscription
        createdAt: now,
        updatedAt: now,
      };

      // Save user to DynamoDB
      await dynamoDbHelpers.putItem(TABLES.USERS, user);

      // Generate token
      const tokenPayload: TokenPayload = {
        userId: user.userId,
        email: user.email,
        subscriptionId: user.subscriptionId,
      };

      const token = generateToken(tokenPayload);

      // Return user data (without password) and token
      const userResponse: UserResponse = {
        userId: user.userId,
        email: user.email,
        subscriptionId: user.subscriptionId,
        subscriptionExpiry: user.subscriptionExpiry,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      return { user: userResponse, token };
    } catch (error) {
      console.error("Error in register service:", error);
      throw error;
    }
  }

  async login(
    email: string,
    password: string
  ): Promise<{ user: UserResponse; token: string }> {
    try {
      // Find user by email
      const users = await dynamoDbHelpers.scan(TABLES.USERS, "email = :email", {
        ":email": email,
      });

      if (!users || users.length === 0) {
        throw new Error("Invalid email or password");
      }

      const user = users[0] as User;

      // Verify password
      const isPasswordValid = await comparePassword(
        password,
        user.passwordHash
      );

      if (!isPasswordValid) {
        throw new Error("Invalid email or password");
      }

      // Generate token
      const tokenPayload: TokenPayload = {
        userId: user.userId,
        email: user.email,
        subscriptionId: user.subscriptionId,
      };

      const token = generateToken(tokenPayload);

      // Return user data (without password) and token
      const userResponse: UserResponse = {
        userId: user.userId,
        email: user.email,
        subscriptionId: user.subscriptionId,
        subscriptionExpiry: user.subscriptionExpiry,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      return { user: userResponse, token };
    } catch (error) {
      console.error("Error in login service:", error);
      throw error;
    }
  }

  async getUserById(userId: string): Promise<UserResponse> {
    try {
      console.log("Getting user by ID:", userId);

      // Get user by ID
      // First, try to get the user directly by userId
      try {
        const user = (await dynamoDbHelpers.getItem(TABLES.USERS, {
          userId,
        })) as User;

        if (user) {
          // Return user data (without password)
          const userResponse: UserResponse = {
            userId: user.userId,
            email: user.email,
            subscriptionId: user.subscriptionId,
            subscriptionExpiry: user.subscriptionExpiry,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          };

          return userResponse;
        }
      } catch (error) {
        console.error("Error getting user by ID directly:", error);
        // Continue to fallback method
      }

      // Fallback: scan the table to find the user
      console.log("Falling back to scan method to find user");
      const users = await dynamoDbHelpers.scan(
        TABLES.USERS,
        "userId = :userId",
        {
          ":userId": userId,
        }
      );

      if (!users || users.length === 0) {
        throw new Error("User not found");
      }

      const user = users[0] as User;

      // Return user data (without password)
      const userResponse: UserResponse = {
        userId: user.userId,
        email: user.email,
        subscriptionId: user.subscriptionId,
        subscriptionExpiry: user.subscriptionExpiry,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      return userResponse;
    } catch (error) {
      console.error("Error in getUserById service:", error);
      throw error;
    }
  }
}

export default new AuthService();
