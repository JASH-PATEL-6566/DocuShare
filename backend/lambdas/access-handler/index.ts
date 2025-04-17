import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { v4 as uuidv4 } from "uuid";
import type { ReturnValue } from "@aws-sdk/client-dynamodb";

// Initialize DynamoDB client
const dynamoDb = DynamoDBDocument.from(
  new DynamoDB({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
  })
);

// Table names
const LINKS_TABLE = process.env.LINKS_TABLE || "Links";
const ACCESS_LOGS_TABLE = process.env.ACCESS_LOGS_TABLE || "AccessLogs";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Parse request body
    const body = JSON.parse(event.body || "{}");
    const { linkId, action, grantId } = body;

    if (!linkId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Link ID is required" }),
      };
    }

    if (!action || !["view", "download"].includes(action)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Valid action is required (view or download)",
        }),
      };
    }

    // Get link from DynamoDB
    const linkParams = {
      TableName: LINKS_TABLE,
      Key: { linkId },
    };

    const linkResult = await dynamoDb.get(linkParams);
    const link = linkResult.Item;

    if (!link) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Link not found" }),
      };
    }

    // Extract client information
    const ipAddress = event.requestContext.identity?.sourceIp || "unknown";
    const userAgent =
      event.headers["User-Agent"] || event.headers["user-agent"] || "unknown";

    // Create access log
    const logId = uuidv4();
    const timestamp = new Date().toISOString();

    const accessLog = {
      logId,
      linkId,
      userId: link.userId,
      grantId: grantId || null,
      ipAddress,
      userAgent,
      timestamp,
      action,
    };

    // Save access log to DynamoDB
    const logParams = {
      TableName: ACCESS_LOGS_TABLE,
      Item: accessLog,
    };

    await dynamoDb.put(logParams);

    // Update link with access count
    let updateExpression = "SET updatedAt = :updatedAt";
    const expressionAttributeValues: Record<string, any> = {
      ":updatedAt": timestamp,
    };

    if (action === "view") {
      updateExpression += ", viewsSoFar = viewsSoFar + :inc";
      expressionAttributeValues[":inc"] = 1;
    } else if (action === "download") {
      updateExpression += ", downloadsSoFar = downloadsSoFar + :inc";
      expressionAttributeValues[":inc"] = 1;
    }

    const updateParams = {
      TableName: LINKS_TABLE,
      Key: { linkId },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "UPDATED_NEW" as ReturnValue,
    };

    await dynamoDb.update(updateParams);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        logId,
      }),
    };
  } catch (error) {
    console.error("Error in access-handler:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};
