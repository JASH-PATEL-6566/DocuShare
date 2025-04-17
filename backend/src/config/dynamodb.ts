import { config } from "dotenv";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";

// Load environment variables
config();

// Log AWS configuration for debugging
console.log("AWS Region:", process.env.AWS_REGION);
console.log("AWS Access Key ID exists:", !!process.env.AWS_ACCESS_KEY_ID);
console.log(
  "AWS Secret Access Key exists:",
  !!process.env.AWS_SECRET_ACCESS_KEY
);
console.log("AWS Session Token exists:", !!process.env.AWS_SESSION_TOKEN);

// Explicitly create credentials object
const credentials: any = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
};

// Add session token if it exists (for temporary credentials)
if (process.env.AWS_SESSION_TOKEN) {
  credentials.sessionToken = process.env.AWS_SESSION_TOKEN;
  console.log("Using AWS session token for authentication");
}

// DynamoDB configuration with explicit credentials
const ddbClientConfig = {
  region: process.env.AWS_REGION || "us-east-1",
  credentials: credentials,
};

// Initialize DynamoDB client
const ddbClient = new DynamoDBClient(ddbClientConfig);

// Document client for simplified JSON operations
export const dynamoDb = DynamoDBDocumentClient.from(ddbClient);

// Table names
export const TABLES = {
  USERS: process.env.USERS_TABLE || "Users",
  FILES: process.env.FILES_TABLE || "Files",
  LINKS: process.env.LINKS_TABLE || "Links",
  ACCESS_LOGS: process.env.ACCESS_LOGS_TABLE || "AccessLogs",
  ACCESS_GRANTS: process.env.ACCESS_GRANT_TABLE || "AccessGrants",
  SUBSCRIPTION_PLANS:
    process.env.SUBSCRIPTION_PLANS_TABLE || "SubscriptionPlans",
};

// Table key schemas - add this to ensure correct key structure
export const TABLE_KEYS = {
  USERS: { primaryKey: "userId" },
  FILES: { primaryKey: "fileId" },
  LINKS: { primaryKey: "linkId" },
  ACCESS_LOGS: { primaryKey: "logId" },
  ACCESS_GRANTS: { primaryKey: "grantId" },
  SUBSCRIPTION_PLANS: { primaryKey: "planId" },
};

// Helper functions for DynamoDB operations
export const dynamoDbHelpers = {
  getItem: async (tableName: string, key: Record<string, any>) => {
    try {
      // Log the table name and key for debugging
      // console.log(
      //   `Getting item from ${tableName} with key:`,
      //   JSON.stringify(key)
      // );

      const result = await dynamoDb.send(
        new GetCommand({ TableName: tableName, Key: key })
      );
      return result.Item;
    } catch (error) {
      console.error(`Error getting item from ${tableName}:`, error);
      throw error;
    }
  },

  putItem: async (tableName: string, item: Record<string, any>) => {
    try {
      await dynamoDb.send(new PutCommand({ TableName: tableName, Item: item }));
      return item;
    } catch (error) {
      console.error(`Error putting item to ${tableName}:`, error);
      throw error;
    }
  },

  updateItem: async (
    tableName: string,
    key: Record<string, any>,
    updateExpression: string,
    expressionAttributeValues: Record<string, any>,
    expressionAttributeNames?: Record<string, string>
  ) => {
    const params: any = {
      TableName: tableName,
      Key: key,
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW",
    };
    if (expressionAttributeNames) {
      params.ExpressionAttributeNames = expressionAttributeNames;
    }

    try {
      const result = await dynamoDb.send(new UpdateCommand(params));
      return result.Attributes;
    } catch (error) {
      console.error(`Error updating item in ${tableName}:`, error);
      throw error;
    }
  },

  deleteItem: async (tableName: string, key: Record<string, any>) => {
    try {
      await dynamoDb.send(
        new DeleteCommand({ TableName: tableName, Key: key })
      );
      return true;
    } catch (error) {
      console.error(`Error deleting item from ${tableName}:`, error);
      throw error;
    }
  },

  query: async (
    tableName: string,
    keyConditionExpression: string,
    expressionAttributeValues: Record<string, any>,
    expressionAttributeNames?: Record<string, string>,
    filterExpression?: string
  ) => {
    const params: any = {
      TableName: tableName,
      KeyConditionExpression: keyConditionExpression,
      ExpressionAttributeValues: expressionAttributeValues,
    };

    if (expressionAttributeNames) {
      params.ExpressionAttributeNames = expressionAttributeNames;
    }

    if (filterExpression) {
      params.FilterExpression = filterExpression;
    }

    try {
      const result = await dynamoDb.send(new QueryCommand(params));
      return result.Items;
    } catch (error) {
      console.error(`Error querying items from ${tableName}:`, error);
      throw error;
    }
  },

  scan: async (
    tableName: string,
    filterExpression?: string,
    expressionAttributeValues?: Record<string, any>,
    expressionAttributeNames?: Record<string, string>
  ) => {
    const params: any = {
      TableName: tableName,
    };

    if (filterExpression) {
      params.FilterExpression = filterExpression;
    }

    if (expressionAttributeValues) {
      params.ExpressionAttributeValues = expressionAttributeValues;
    }

    if (expressionAttributeNames) {
      params.ExpressionAttributeNames = expressionAttributeNames;
    }

    try {
      const result = await dynamoDb.send(new ScanCommand(params));
      return result.Items;
    } catch (error) {
      console.error(`Error scanning items from ${tableName}:`, error);
      throw error;
    }
  },
};
