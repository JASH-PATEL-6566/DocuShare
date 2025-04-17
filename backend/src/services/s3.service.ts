import { v4 as uuidv4 } from "uuid";
import { s3Helpers } from "../config/s3";
import { dynamoDbHelpers, TABLES } from "../config/dynamodb";
import type {
  File,
  FileCreateInput,
  FileResponse,
  UploadUrlResponse,
} from "../models/file.model";
import { s3 } from "../config/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";

export class S3Service {
  // New method to upload file directly to S3
  async uploadFileToS3(
    s3Key: string,
    fileBuffer: Buffer,
    contentType: string
  ): Promise<boolean> {
    try {
      const params = {
        Bucket: process.env.S3_BUCKET_NAME || "docushare-files",
        Key: s3Key,
        Body: fileBuffer,
        ContentType: contentType,
      };

      await s3.send(new PutObjectCommand(params));
      return true;
    } catch (error) {
      console.error("Error uploading file to S3:", error);
      return false;
    }
  }

  async generateUploadUrl(
    userId: string,
    fileName: string,
    fileType: string
  ): Promise<UploadUrlResponse> {
    try {
      // Generate a unique file ID
      const fileId = uuidv4();

      // Create S3 key (path in the bucket)
      const s3Key = `${userId}/${fileId}/${fileName}`;

      // Generate pre-signed URL for upload
      const uploadUrl = await s3Helpers.getSignedUploadUrl(s3Key, fileType);

      return {
        uploadUrl,
        fileId,
        s3Key,
      };
    } catch (error) {
      console.error("Error generating upload URL:", error);
      throw error;
    }
  }

  async confirmUpload(input: FileCreateInput): Promise<FileResponse> {
    try {
      // Check if file exists in S3
      const fileExists = await s3Helpers.fileExists(input.s3Key);

      if (!fileExists) {
        throw new Error("File not found in S3");
      }

      // Create file record
      const now = new Date().toISOString();

      const file: File = {
        fileId: uuidv4(),
        userId: input.userId,
        fileName: input.fileName,
        fileSize: input.fileSize,
        fileType: input.fileType,
        s3Url: input.s3Key,
        uploadTime: now,
        updatedAt: now,
      };

      // Save file metadata to DynamoDB
      await dynamoDbHelpers.putItem(TABLES.FILES, file);

      // Return file data
      const fileResponse: FileResponse = {
        fileId: file.fileId,
        fileName: file.fileName,
        fileSize: file.fileSize,
        fileType: file.fileType,
        uploadTime: file.uploadTime,
        updatedAt: file.updatedAt,
      };

      return fileResponse;
    } catch (error) {
      console.error("Error confirming upload:", error);
      throw error;
    }
  }

  async generateDownloadUrl(fileId: string, userId: string): Promise<string> {
    try {
      // Get file metadata
      const file = (await dynamoDbHelpers.getItem(TABLES.FILES, {
        fileId,
      })) as File;

      if (!file) {
        throw new Error("File not found");
      }

      // Check if user has access to the file
      if (file.userId !== userId) {
        throw new Error("Access denied");
      }

      // Generate pre-signed URL for download
      const downloadUrl = await s3Helpers.getSignedDownloadUrl(file.s3Url);

      return downloadUrl;
    } catch (error) {
      console.error("Error generating download URL:", error);
      throw error;
    }
  }

  async deleteFile(fileId: string, userId: string): Promise<boolean> {
    try {
      // Get file metadata
      const file = (await dynamoDbHelpers.getItem(TABLES.FILES, {
        fileId,
      })) as File;

      if (!file) {
        throw new Error("File not found");
      }

      // Check if user has access to the file
      if (file.userId !== userId) {
        throw new Error("Access denied");
      }

      // Find all links associated with this file
      const links =
        (await dynamoDbHelpers.scan(TABLES.LINKS, "fileId = :fileId", {
          ":fileId": fileId,
        })) || [];

      console.log(`Found ${links.length} links associated with file ${fileId}`);

      // Delete all associated links
      for (const link of links) {
        try {
          await dynamoDbHelpers.deleteItem(TABLES.LINKS, {
            linkId: link.linkId,
          });
          console.log(
            `Deleted link ${link.linkId} associated with file ${fileId}`
          );
        } catch (error) {
          console.error(`Error deleting link ${link.linkId}:`, error);
          // Continue with other links even if one fails
        }
      }

      // Delete file from S3
      await s3Helpers.deleteFile(file.s3Url);

      // Delete file metadata from DynamoDB
      await dynamoDbHelpers.deleteItem(TABLES.FILES, { fileId });

      return true;
    } catch (error) {
      console.error("Error deleting file:", error);
      throw error;
    }
  }

  async getUserFiles(userId: string): Promise<FileResponse[]> {
    try {
      // Query files by userId
      const files = (await dynamoDbHelpers.scan(
        TABLES.FILES,
        "userId = :userId",
        { ":userId": userId }
      )) as File[];

      // Map files to response format
      const fileResponses: FileResponse[] = files.map((file) => ({
        fileId: file.fileId,
        fileName: file.fileName,
        fileSize: file.fileSize,
        fileType: file.fileType,
        uploadTime: file.uploadTime,
        updatedAt: file.updatedAt,
      }));

      return fileResponses;
    } catch (error) {
      console.error("Error getting user files:", error);
      throw error;
    }
  }
}

export default new S3Service();
