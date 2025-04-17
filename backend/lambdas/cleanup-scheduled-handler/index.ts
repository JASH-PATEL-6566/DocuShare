import type { ScheduledEvent, Context } from "aws-lambda";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { S3 } from "@aws-sdk/client-s3";

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

// Initialize S3 client
const s3 = new S3({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

// Table names
const LINKS_TABLE = process.env.LINKS_TABLE || "Links";
const FILES_TABLE = process.env.FILES_TABLE || "Files";
const ACCESS_LOGS_TABLE = process.env.ACCESS_LOGS_TABLE || "AccessLogs";
const ACCESS_GRANTS_TABLE = process.env.ACCESS_GRANTS_TABLE || "AccessGrants";

// S3 bucket name
const BUCKET_NAME = process.env.S3_BUCKET_NAME || "docushare-files";

export const handler = async (
  event: ScheduledEvent,
  context: Context
): Promise<void> => {
  try {
    console.log("Starting scheduled cleanup process");

    // Get current timestamp
    const now = new Date().toISOString();

    // 1. Find expired links
    const expiredLinksParams = {
      TableName: LINKS_TABLE,
      FilterExpression: "expiryTimestamp < :now",
      ExpressionAttributeValues: {
        ":now": now,
      },
    };

    const expiredLinksResult = await dynamoDb.scan(expiredLinksParams);
    const expiredLinks = expiredLinksResult.Items || [];

    console.log(`Found ${expiredLinks.length} expired links`);

    // 2. Process each expired link
    for (const link of expiredLinks) {
      const linkId = link.linkId;
      const fileId = link.fileId;

      console.log(`Processing expired link: ${linkId} for file: ${fileId}`);

      // 2.1 Delete access grants for this link
      const grantsParams = {
        TableName: ACCESS_GRANTS_TABLE,
        FilterExpression: "linkId = :linkId",
        ExpressionAttributeValues: {
          ":linkId": linkId,
        },
      };

      const grantsResult = await dynamoDb.scan(grantsParams);
      const grants = grantsResult.Items || [];

      console.log(`Found ${grants.length} access grants for linkId: ${linkId}`);

      for (const grant of grants) {
        await dynamoDb.delete({
          TableName: ACCESS_GRANTS_TABLE,
          Key: { grantId: grant.grantId },
        });
        console.log(`Deleted access grant: ${grant.grantId}`);
      }

      // 2.2 Delete access logs for this link
      const logsParams = {
        TableName: ACCESS_LOGS_TABLE,
        FilterExpression: "linkId = :linkId",
        ExpressionAttributeValues: {
          ":linkId": linkId,
        },
      };

      const logsResult = await dynamoDb.scan(logsParams);
      const logs = logsResult.Items || [];

      console.log(`Found ${logs.length} access logs for linkId: ${linkId}`);

      for (const log of logs) {
        await dynamoDb.delete({
          TableName: ACCESS_LOGS_TABLE,
          Key: { logId: log.logId },
        });
        console.log(`Deleted access log: ${log.logId}`);
      }

      // 2.3 Delete the link itself
      await dynamoDb.delete({
        TableName: LINKS_TABLE,
        Key: { linkId },
      });
      console.log(`Deleted link: ${linkId}`);

      // 2.4 Check if there are any other links for this file
      const otherLinksParams = {
        TableName: LINKS_TABLE,
        FilterExpression: "fileId = :fileId",
        ExpressionAttributeValues: {
          ":fileId": fileId,
        },
      };

      const otherLinksResult = await dynamoDb.scan(otherLinksParams);
      const otherLinks = otherLinksResult.Items || [];

      // If no other links exist for this file, delete the file
      if (otherLinks.length === 0) {
        console.log(
          `No other links found for fileId: ${fileId}, deleting file`
        );

        // Get file information
        const fileParams = {
          TableName: FILES_TABLE,
          Key: { fileId },
        };

        const fileResult = await dynamoDb.get(fileParams);
        const file = fileResult.Item;

        if (file) {
          // Delete file from S3
          try {
            await s3.deleteObject({
              Bucket: BUCKET_NAME,
              Key: file.s3Url,
            });
            console.log(`Deleted file from S3: ${file.s3Url}`);
          } catch (s3Error) {
            console.error("Error deleting file from S3:", s3Error);
            // Continue with the process even if S3 deletion fails
          }

          // Delete file metadata from DynamoDB
          await dynamoDb.delete({
            TableName: FILES_TABLE,
            Key: { fileId },
          });
          console.log(`Deleted file metadata from DynamoDB: ${fileId}`);
        } else {
          console.log(`File not found in DynamoDB: ${fileId}`);
        }
      } else {
        console.log(
          `Found ${otherLinks.length} other links for fileId: ${fileId}, keeping file`
        );
      }
    }

    // 3. Clean up old access logs (optional, based on retention policy)
    // For example, delete logs older than 90 days
    const retentionDays = 90;
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() - retentionDays);
    const retentionTimestamp = retentionDate.toISOString();

    const oldLogsParams = {
      TableName: ACCESS_LOGS_TABLE,
      FilterExpression: "timestamp < :retentionDate",
      ExpressionAttributeValues: {
        ":retentionDate": retentionTimestamp,
      },
    };

    const oldLogsResult = await dynamoDb.scan(oldLogsParams);
    const oldLogs = oldLogsResult.Items || [];

    console.log(
      `Found ${oldLogs.length} access logs older than ${retentionDays} days`
    );

    for (const log of oldLogs) {
      await dynamoDb.delete({
        TableName: ACCESS_LOGS_TABLE,
        Key: { logId: log.logId },
      });
      console.log(`Deleted old access log: ${log.logId}`);
    }

    console.log("Scheduled cleanup process completed successfully");
  } catch (error) {
    console.error("Error in scheduled cleanup handler:", error);
    throw error;
  }
};
