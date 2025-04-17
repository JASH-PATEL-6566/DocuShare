export interface AccessLogEntry {
  logId: string;
  grantId?: string;
  linkId: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  action: "view" | "download";
}

export interface AccessLogsQueryParams {
  linkId?: string;
  action?: "view" | "download";
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface AccessLogResponse extends AccessLogEntry {
  fileName?: string;
  fileType?: string;
}

export interface AccessLogStats {
  totalViews: number;
  totalDownloads: number;
  uniqueIPs: number;
}

export interface TopFile {
  linkId: string;
  fileName: string;
  fileType: string;
  viewCount: number;
  downloadCount: number;
}

export interface AccessByDate {
  date: string;
  views: number;
  downloads: number;
}

export interface AccessLogStatsResponse {
  totalViews: number;
  totalDownloads: number;
  uniqueIPs: number;
  topFiles: TopFile[];
  accessByDate: AccessByDate[];
}

export interface AccessLogsResponse {
  logs: AccessLogResponse[];
  total: number;
  stats: AccessLogStats;
}
