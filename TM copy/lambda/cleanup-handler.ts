import type { SQSEvent, Context } from "aws-lambda";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { S3 } from "@aws-sdk/client-s3";

const dynamoDb = DynamoDBDocument.from(
  new DynamoDB({ region: process.env.AWS_REGION || "us-east-2" })
);

const s3 = new S3({ region: process.env.AWS_REGION || "us-east-2" });

// Table names
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
      const s3Key = body.s3Url;

      if (!fileId) {
        console.warn("Missing fileId in message, skipping");
        continue;
      }

      console.log(`Processing deletion for fileId: ${fileId}`);

      // 1. Find all links associated with this file
      const linksResult = await dynamoDb.scan({
        TableName: LINKS_TABLE,
        FilterExpression: "fileId = :fileId",
        ExpressionAttributeValues: { ":fileId": fileId },
      });

      const links = linksResult.Items || [];
      console.log(`Found ${links.length} links for fileId: ${fileId}`);

      for (const link of links) {
        const linkId = link.linkId;

        // 2.1 Delete access grants
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

        // 2.2 Delete access logs
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

        // 2.3 Delete the link itself
        await dynamoDb.delete({
          TableName: LINKS_TABLE,
          Key: { linkId },
        });
        console.log(`Deleted link: ${linkId}`);
      }

      // 3. Delete the file from S3
      if (s3Key) {
        try {
          await s3.deleteObject({
            Bucket: BUCKET_NAME,
            Key: s3Key,
          });
          console.log(`Deleted file from S3: ${s3Key}`);
        } catch (s3Error) {
          console.error("Failed to delete S3 file:", s3Error);
        }
      } else {
        console.log("No S3 key provided, skipping S3 deletion");
      }

      console.log(`Cleanup completed for fileId: ${fileId}`);
    }

    console.log("All SQS records processed successfully");
  } catch (error) {
    console.error("Error in cleanup Lambda:", error);
    throw error;
  }
};
