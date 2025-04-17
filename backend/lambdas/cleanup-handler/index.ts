import type { DynamoDBStreamEvent, Context } from "aws-lambda";
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
  event: DynamoDBStreamEvent,
  context: Context
): Promise<void> => {
  try {
    console.log("Starting cleanup process");

    // Process each record in the DynamoDB stream
    for (const record of event.Records) {
      // Only process REMOVE events (when a file is deleted)
      if (
        record.eventName === "REMOVE" &&
        record.eventSourceARN?.includes(FILES_TABLE)
      ) {
        const fileId = record.dynamodb?.Keys?.fileId?.S;

        if (!fileId) {
          console.log("No fileId found in the record, skipping");
          continue;
        }

        console.log(`Processing file deletion for fileId: ${fileId}`);

        // 1. Find all links associated with this file
        const linksParams = {
          TableName: LINKS_TABLE,
          FilterExpression: "fileId = :fileId",
          ExpressionAttributeValues: {
            ":fileId": fileId,
          },
        };

        const linksResult = await dynamoDb.scan(linksParams);
        const links = linksResult.Items || [];

        console.log(
          `Found ${links.length} links associated with fileId: ${fileId}`
        );

        // 2. For each link, delete associated access grants and logs
        for (const link of links) {
          const linkId = link.linkId;

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

          console.log(
            `Found ${grants.length} access grants for linkId: ${linkId}`
          );

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
        }

        // 3. Delete the file from S3 if it exists
        try {
          // Get the S3 key from the file record
          const s3Key = record.dynamodb?.OldImage?.s3Url?.S;

          if (s3Key) {
            await s3.deleteObject({
              Bucket: BUCKET_NAME,
              Key: s3Key,
            });
            console.log(`Deleted file from S3: ${s3Key}`);
          } else {
            console.log(
              "No S3 key found in the file record, skipping S3 deletion"
            );
          }
        } catch (s3Error) {
          console.error("Error deleting file from S3:", s3Error);
          // Continue with the process even if S3 deletion fails
        }

        console.log(`Cleanup completed for fileId: ${fileId}`);
      }
    }

    console.log("Cleanup process completed successfully");
  } catch (error) {
    console.error("Error in cleanup-handler:", error);
    throw error;
  }
};
