export interface AccessGrant {
  grantId: string;
  linkId: string;
  recipientEmail?: string;
  recipientIdentifier?: string;
  status: "active" | "revoked";
  createdAt: string;
  updatedAt: string;
  revokedAt?: string;
  lastAccessedAt?: string;
  accessCount: number;
}

export interface AccessGrantCreateInput {
  linkId: string;
  recipientEmail?: string;
  recipientIdentifier?: string;
}

export interface AccessGrantResponse {
  grantId: string;
  linkId: string;
  recipientEmail?: string;
  recipientIdentifier?: string;
  status: "active" | "revoked";
  createdAt: string;
  lastAccessedAt?: string;
  accessCount: number;
}

export interface AccessLogEntry {
  logId: string;
  grantId: string;
  linkId: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  action: "view" | "download";
}
