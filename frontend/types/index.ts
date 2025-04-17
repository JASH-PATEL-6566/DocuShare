export interface FileType {
  fileId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadTime: string;
  updatedAt: string;
}

export interface LinkType {
  linkId: string;
  shareableLink: string;
  expiryTimestamp: string;
  hasPassword: boolean;
  downloadLimit: number;
  viewLimit: number;
  allowDownload: boolean;
  status: "active" | "revoked" | "expired";
  requireIdentification: boolean;
  createdAt: string;
}

export interface AccessGrantType {
  grantId: string;
  linkId: string;
  recipientEmail: string;
  recipientIdentifier?: string;
  status: "active" | "revoked";
  createdAt: string;
  lastAccessedAt?: string;
  accessCount: number;
}
