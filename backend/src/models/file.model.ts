export interface File {
  fileId: string
  userId: string
  fileName: string
  fileSize: number
  fileType: string
  s3Url: string
  uploadTime: string
  updatedAt: string
}

export interface FileCreateInput {
  userId: string
  fileName: string
  fileSize: number
  fileType: string
  s3Key: string
}

export interface FileUpdateInput {
  fileName?: string
}

export interface FileResponse {
  fileId: string
  fileName: string
  fileSize: number
  fileType: string
  uploadTime: string
  updatedAt: string
}

// Add a new interface for link creation
export interface LinkCreateInput {
  fileId: string
  expiryIn: string
  password?: string
  downloadLimit?: number
  viewLimit?: number
  allowDownload: boolean
  requireIdentification?: boolean // New field to require recipient identification
}

export interface LinkResponse {
  linkId: string
  shareableLink: string
  expiryTimestamp: string
  hasPassword: boolean
  downloadLimit?: number
  viewLimit?: number
  allowDownload: boolean
  status: "active" | "revoked" // New field to track link status
  requireIdentification: boolean // New field to require recipient identification
  createdAt: string
}

export interface UploadUrlResponse {
  uploadUrl: string
  fileId: string
  s3Key: string
}
