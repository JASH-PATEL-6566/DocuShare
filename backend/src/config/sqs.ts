import { SQS } from "@aws-sdk/client-sqs";
import { config } from "dotenv";

// Load environment variables
config();

// Explicitly create credentials object
const credentials: any = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
};

// Add session token if it exists (for temporary credentials)
if (process.env.AWS_SESSION_TOKEN) {
  credentials.sessionToken = process.env.AWS_SESSION_TOKEN;
}

// SQS configuration with explicit credentials
const sqsConfig = {
  region: process.env.AWS_REGION || "us-east-2",
  credentials: credentials,
};

// Initialize SQS client
export const sqs = new SQS(sqsConfig);

// SQS queue URL
export const QUEUE_URL =
  process.env.SQS_QUEUE_URL ||
  "https://sqs.us-east-2.amazonaws.com/715841365404/DocuShare-messages";

// Helper functions for common SQS operations
export const sqsHelpers = {
  // Send a message to the SQS queue
  sendEventMessage: async (eventData: object) => {
    const messageBody = JSON.stringify(eventData); // Stringify the JSON event data

    const params = {
      QueueUrl: QUEUE_URL,
      MessageBody: messageBody,
    };

    try {
      const data = await sqs.sendMessage(params);
      console.log("Message sent successfully:", data.MessageId);
      return data.MessageId;
    } catch (error) {
      console.error("Error sending message to SQS:", error);
      throw error;
    }
  },
};
