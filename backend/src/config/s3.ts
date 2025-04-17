import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand, PutObjectCommand, S3 } from "@aws-sdk/client-s3";
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

// S3 configuration with explicit credentials
const s3Config = {
  region: process.env.AWS_REGION || "us-east-1",
  credentials: credentials,
};

// Initialize S3 client
export const s3 = new S3(s3Config);

// S3 bucket name
export const BUCKET_NAME = process.env.S3_BUCKET_NAME || "docushare-files";

// Helper functions for common S3 operations
export const s3Helpers = {
  // Generate a pre-signed URL for uploading a file
  getSignedUploadUrl: async (
    key: string,
    contentType: string,
    expiresIn = 60
  ) => {
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    };

    try {
      const url = await getSignedUrl(s3, new PutObjectCommand(params), {
        expiresIn,
      });
      return url;
    } catch (error) {
      console.error("Error generating signed upload URL:", error);
      throw error;
    }
  },

  // Generate a pre-signed URL for downloading a file
  getSignedDownloadUrl: async (key: string, expiresIn = 60, inline = false) => {
    const params: any = {
      Bucket: BUCKET_NAME,
      Key: key,
    };

    // If inline is true, set the content disposition to inline
    if (inline) {
      params.ResponseContentDisposition = "inline";
    } else {
      // Extract filename from the key (last part after the last slash)
      const filename = key.split("/").pop();
      params.ResponseContentDisposition = `attachment; filename="${filename}"`;
    }

    try {
      const url = await getSignedUrl(s3, new GetObjectCommand(params), {
        expiresIn,
      });
      return url;
    } catch (error) {
      console.error("Error generating signed download URL:", error);
      throw error;
    }
  },

  // Delete a file from S3
  deleteFile: async (key: string) => {
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
    };

    try {
      await s3.deleteObject(params);
      return true;
    } catch (error) {
      console.error("Error deleting file from S3:", error);
      throw error;
    }
  },

  // Check if a file exists in S3
  fileExists: async (key: string) => {
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
    };

    try {
      await s3.headObject(params);
      return true;
    } catch (error) {
      if ((error as any).code === "NotFound") {
        return false;
      }
      console.error("Error checking if file exists in S3:", error);
      throw error;
    }
  },
};
