import type { SQSEvent, Context } from "aws-lambda";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { S3 } from "@aws-sdk/client-s3";

const dynamoDb = DynamoDBDocument.from(
  new DynamoDB({ region: process.env.AWS_REGION || "us-east-2" })
);

const s3 = new S3({ region: process.env.AWS_REGION || "us-east-2" });

// Table names
const FILES_TABLE = process.env.FILES_TABLE || "Files";
const LINKS_TABLE = process.env.LINKS_TABLE || "Links";
const ACCESS_LOGS_TABLE = process.env.ACCESS_LOGS_TABLE || "AccessLogs";
const ACCESS_GRANTS_TABLE = process.env.ACCESS_GRANTS_TABLE || "AccessGrants";

// S3 bucket name
const BUCKET_NAME = process.env.S3_BUCKET_NAME || "docushare-storage";

export const handler = async (
  event: SQSEvent,
  context: Context
): Promise<void> => {
  try {
    console.log("Received SQS event with records:", event.Records.length);

    for (const sqsRecord of event.Records) {
      const body = JSON.parse(sqsRecord.body);
      const fileId = body.fileId;
      const userId = body.userId; // Get userId from the event body

      if (!fileId || !userId) {
        console.warn("Missing fileId or userId in message, skipping");
        continue;
      }

      console.log(
        `Processing deletion for fileId: ${fileId} by userId: ${userId}`
      );

      // 1. Fetch the file record from the FILES table
      const fileResult = await dynamoDb.get({
        TableName: FILES_TABLE,
        Key: { fileId },
      });

      const file = fileResult.Item;
      if (!file) {
        console.warn(`File with fileId: ${fileId} not found in the database`);
        continue;
      }

      // Ensure that the file belongs to the user
      if (file.userId !== userId) {
        console.warn(
          `UserId mismatch: User ${userId} does not have permission to delete fileId: ${fileId}`
        );
        continue;
      }

      // 2. Extract the s3Url from the file record
      const s3Key = file.s3Url;
      if (!s3Key) {
        console.warn(
          `No s3Url found for fileId: ${fileId}, skipping S3 deletion`
        );
        continue;
      }

      // 3. Delete the file from DynamoDB (FILES table)
      await dynamoDb.delete({
        TableName: FILES_TABLE,
        Key: { fileId },
      });
      console.log(`Deleted file from FILES table with fileId: ${fileId}`);

      // 4. Find all links associated with this file
      const linksResult = await dynamoDb.scan({
        TableName: LINKS_TABLE,
        FilterExpression: "fileId = :fileId",
        ExpressionAttributeValues: { ":fileId": fileId },
      });

      const links = linksResult.Items || [];
      console.log(`Found ${links.length} links for fileId: ${fileId}`);

      for (const link of links) {
        const linkId = link.linkId;

        // 4.1 Delete access grants
        const grantsResult = await dynamoDb.scan({
          TableName: ACCESS_GRANTS_TABLE,
          FilterExpression: "linkId = :linkId",
          ExpressionAttributeValues: { ":linkId": linkId },
        });

        const grants = grantsResult.Items || [];
        for (const grant of grants) {
          await dynamoDb.delete({
            TableName: ACCESS_GRANTS_TABLE,
            Key: { grantId: grant.grantId },
          });
          console.log(`Deleted access grant: ${grant.grantId}`);
        }

        // 4.2 Delete access logs
        const logsResult = await dynamoDb.scan({
          TableName: ACCESS_LOGS_TABLE,
          FilterExpression: "linkId = :linkId",
          ExpressionAttributeValues: { ":linkId": linkId },
        });

        const logs = logsResult.Items || [];
        for (const log of logs) {
          await dynamoDb.delete({
            TableName: ACCESS_LOGS_TABLE,
            Key: { logId: log.logId },
          });
          console.log(`Deleted access log: ${log.logId}`);
        }

        // 4.3 Delete the link itself
        await dynamoDb.delete({
          TableName: LINKS_TABLE,
          Key: { linkId },
        });
        console.log(`Deleted link: ${linkId}`);
      }

      // 5. Delete the file from S3
      try {
        await s3.deleteObject({
          Bucket: BUCKET_NAME,
          Key: s3Key,
        });
        console.log(`Deleted file from S3: ${s3Key}`);
      } catch (s3Error) {
        console.error("Failed to delete S3 file:", s3Error);
      }

      console.log(`Cleanup completed for fileId: ${fileId}`);
    }

    console.log("All SQS records processed successfully");
  } catch (error) {
    console.error("Error in cleanup Lambda:", error);
    throw error;
  }
};
