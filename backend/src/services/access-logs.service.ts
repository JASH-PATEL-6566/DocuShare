import { dynamoDbHelpers, TABLES } from "../config/dynamodb";
import type {
  AccessLogEntry,
  AccessLogsQueryParams,
  AccessLogsResponse,
  AccessLogResponse,
  AccessLogStats,
  AccessLogStatsResponse,
  TopFile,
  AccessByDate,
} from "../models/access-log.model";

export class AccessLogService {
  async getAccessLogs(
    userId: string,
    queryParams: AccessLogsQueryParams
  ): Promise<AccessLogsResponse> {
    try {
      // Set default values for pagination
      const limit = queryParams.limit || 100;
      const offset = queryParams.offset || 0;

      // Build filter expression and attribute values
      let filterExpression = "";
      const expressionAttributeValues: Record<string, any> = {};

      // If linkId is provided, verify the user owns the link
      if (queryParams.linkId) {
        const link = await dynamoDbHelpers.getItem(TABLES.LINKS, {
          linkId: queryParams.linkId,
        });

        if (!link) {
          throw new Error("Link not found");
        }

        if (link.userId !== userId) {
          throw new Error("Access denied");
        }

        filterExpression += "linkId = :linkId";
        expressionAttributeValues[":linkId"] = queryParams.linkId;
      } else {
        // If no specific linkId, get all links owned by the user
        const userLinks = await dynamoDbHelpers.scan(
          TABLES.LINKS,
          "userId = :userId",
          {
            ":userId": userId,
          }
        );

        if (!userLinks || userLinks.length === 0) {
          // User has no links, return empty result
          return {
            logs: [],
            total: 0,
            stats: {
              totalViews: 0,
              totalDownloads: 0,
              uniqueIPs: 0,
            },
          };
        }

        // Build filter for all user's links
        const linkIds = userLinks.map((link) => link.linkId);

        if (linkIds.length === 1) {
          filterExpression += "linkId = :linkId";
          expressionAttributeValues[":linkId"] = linkIds[0];
        } else {
          filterExpression += "linkId IN (";
          linkIds.forEach((linkId, index) => {
            const placeholder = `:linkId${index}`;
            filterExpression += index > 0 ? `, ${placeholder}` : placeholder;
            expressionAttributeValues[placeholder] = linkId;
          });
          filterExpression += ")";
        }
      }

      // Add action filter if provided
      if (queryParams.action) {
        filterExpression += filterExpression ? " AND " : "";
        filterExpression += "action = :action";
        expressionAttributeValues[":action"] = queryParams.action;
      }

      // Add date range filters if provided
      if (queryParams.startDate) {
        filterExpression += filterExpression ? " AND " : "";
        filterExpression += "timestamp >= :startDate";
        expressionAttributeValues[":startDate"] = queryParams.startDate;
      }

      if (queryParams.endDate) {
        filterExpression += filterExpression ? " AND " : "";
        filterExpression += "timestamp <= :endDate";
        expressionAttributeValues[":endDate"] = queryParams.endDate;
      }

      // Get logs with filtering
      const logs = (await dynamoDbHelpers.scan(
        TABLES.ACCESS_LOGS,
        filterExpression,
        expressionAttributeValues
      )) as AccessLogEntry[];

      // Calculate total before pagination
      const total = logs.length;

      // Apply pagination
      const paginatedLogs = logs
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        .slice(offset, offset + limit);

      // Enrich logs with file information and ensure valid timestamps
      const enrichedLogs: AccessLogResponse[] = await Promise.all(
        paginatedLogs.map(async (log) => {
          try {
            // Ensure timestamp is a valid ISO string
            let validTimestamp = log.timestamp;
            try {
              // Check if timestamp is valid
              const date = new Date(log.timestamp);
              if (isNaN(date.getTime())) {
                // If invalid, use current time as fallback
                validTimestamp = new Date().toISOString();
              } else {
                // Ensure it's in ISO format
                validTimestamp = date.toISOString();
              }
            } catch (e) {
              validTimestamp = new Date().toISOString();
            }

            // Get link information
            const link = await dynamoDbHelpers.getItem(TABLES.LINKS, {
              linkId: log.linkId,
            });

            if (!link) {
              return {
                ...log,
                timestamp: validTimestamp,
                fileName: "Unknown File",
                fileType: "unknown",
              };
            }

            // Get file information
            const file = await dynamoDbHelpers.getItem(TABLES.FILES, {
              fileId: link.fileId,
            });

            if (!file) {
              return {
                ...log,
                timestamp: validTimestamp,
                fileName: "Unknown File",
                fileType: "unknown",
              };
            }

            return {
              ...log,
              timestamp: validTimestamp,
              fileName: file.fileName,
              fileType: file.fileType,
            };
          } catch (error) {
            console.error("Error enriching log with file info:", error);
            // Return log with valid timestamp
            return {
              ...log,
              timestamp: new Date().toISOString(),
              fileName: "Unknown File",
              fileType: "unknown",
            };
          }
        })
      );

      // Calculate statistics
      const stats: AccessLogStats = {
        totalViews: logs.filter((log) => log.action === "view").length,
        totalDownloads: logs.filter((log) => log.action === "download").length,
        uniqueIPs: new Set(logs.map((log) => log.ipAddress)).size,
      };

      return {
        logs: enrichedLogs,
        total,
        stats,
      };
    } catch (error) {
      console.error("Error in getAccessLogs service:", error);
      throw error;
    }
  }

  async getAccessLogStats(
    userId: string,
    queryParams: AccessLogsQueryParams
  ): Promise<AccessLogStatsResponse> {
    try {
      // Build filter expression and attribute values similar to getAccessLogs
      let filterExpression = "";
      const expressionAttributeValues: Record<string, any> = {};

      // If linkId is provided, verify the user owns the link
      if (queryParams.linkId) {
        const link = await dynamoDbHelpers.getItem(TABLES.LINKS, {
          linkId: queryParams.linkId,
        });

        if (!link) {
          throw new Error("Link not found");
        }

        if (link.userId !== userId) {
          throw new Error("Access denied");
        }

        filterExpression += "linkId = :linkId";
        expressionAttributeValues[":linkId"] = queryParams.linkId;
      } else {
        // If no specific linkId, get all links owned by the user
        const userLinks = await dynamoDbHelpers.scan(
          TABLES.LINKS,
          "userId = :userId",
          {
            ":userId": userId,
          }
        );

        if (!userLinks || userLinks.length === 0) {
          // User has no links, return empty stats
          return {
            totalViews: 0,
            totalDownloads: 0,
            uniqueIPs: 0,
            topFiles: [],
            accessByDate: [],
          };
        }

        // Build filter for all user's links
        const linkIds = userLinks.map((link) => link.linkId);

        if (linkIds.length === 1) {
          filterExpression += "linkId = :linkId";
          expressionAttributeValues[":linkId"] = linkIds[0];
        } else {
          filterExpression += "linkId IN (";
          linkIds.forEach((linkId, index) => {
            const placeholder = `:linkId${index}`;
            filterExpression += index > 0 ? `, ${placeholder}` : placeholder;
            expressionAttributeValues[placeholder] = linkId;
          });
          filterExpression += ")";
        }
      }

      // Add action filter if provided
      if (queryParams.action) {
        filterExpression += filterExpression ? " AND " : "";
        filterExpression += "action = :action";
        expressionAttributeValues[":action"] = queryParams.action;
      }

      // Add date range filters if provided
      if (queryParams.startDate) {
        filterExpression += filterExpression ? " AND " : "";
        filterExpression += "timestamp >= :startDate";
        expressionAttributeValues[":startDate"] = queryParams.startDate;
      }

      if (queryParams.endDate) {
        filterExpression += filterExpression ? " AND " : "";
        filterExpression += "timestamp <= :endDate";
        expressionAttributeValues[":endDate"] = queryParams.endDate;
      }

      // Get logs with filtering
      const logs = (await dynamoDbHelpers.scan(
        TABLES.ACCESS_LOGS,
        filterExpression,
        expressionAttributeValues
      )) as AccessLogEntry[];

      // Calculate basic statistics
      const totalViews = logs.filter((log) => log.action === "view").length;
      const totalDownloads = logs.filter(
        (log) => log.action === "download"
      ).length;
      const uniqueIPs = new Set(logs.map((log) => log.ipAddress)).size;

      // Calculate top files
      const fileStats: Record<string, { views: number; downloads: number }> =
        {};

      logs.forEach((log) => {
        if (!fileStats[log.linkId]) {
          fileStats[log.linkId] = { views: 0, downloads: 0 };
        }

        if (log.action === "view") {
          fileStats[log.linkId].views++;
        } else if (log.action === "download") {
          fileStats[log.linkId].downloads++;
        }
      });

      // Get file details and create top files array
      const topFiles: TopFile[] = await Promise.all(
        Object.entries(fileStats)
          .sort((a, b) => {
            const totalA = a[1].views + a[1].downloads;
            const totalB = b[1].views + b[1].downloads;
            return totalB - totalA;
          })
          .slice(0, 10) // Get top 10 files
          .map(async ([linkId, stats]) => {
            try {
              const link = await dynamoDbHelpers.getItem(TABLES.LINKS, {
                linkId,
              });

              if (!link) {
                return {
                  linkId,
                  fileName: "Unknown File",
                  fileType: "unknown",
                  viewCount: stats.views,
                  downloadCount: stats.downloads,
                };
              }

              const file = await dynamoDbHelpers.getItem(TABLES.FILES, {
                fileId: link.fileId,
              });

              if (!file) {
                return {
                  linkId,
                  fileName: "Unknown File",
                  fileType: "unknown",
                  viewCount: stats.views,
                  downloadCount: stats.downloads,
                };
              }

              return {
                linkId,
                fileName: file.fileName,
                fileType: file.fileType,
                viewCount: stats.views,
                downloadCount: stats.downloads,
              };
            } catch (error) {
              console.error("Error getting file details for stats:", error);
              return {
                linkId,
                fileName: "Unknown File",
                fileType: "unknown",
                viewCount: stats.views,
                downloadCount: stats.downloads,
              };
            }
          })
      );

      // Calculate access by date
      const dateStats: Record<string, { views: number; downloads: number }> =
        {};

      logs.forEach((log) => {
        // Ensure timestamp is valid before extracting date
        let dateStr: string;
        try {
          const date = new Date(log.timestamp);
          if (isNaN(date.getTime())) {
            // Use current date if timestamp is invalid
            dateStr = new Date().toISOString().split("T")[0];
          } else {
            dateStr = date.toISOString().split("T")[0]; // Extract YYYY-MM-DD
          }
        } catch (e) {
          dateStr = new Date().toISOString().split("T")[0];
        }

        if (!dateStats[dateStr]) {
          dateStats[dateStr] = { views: 0, downloads: 0 };
        }

        if (log.action === "view") {
          dateStats[dateStr].views++;
        } else if (log.action === "download") {
          dateStats[dateStr].downloads++;
        }
      });

      const accessByDate: AccessByDate[] = Object.entries(dateStats)
        .map(([date, stats]) => ({
          date,
          views: stats.views,
          downloads: stats.downloads,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        totalViews,
        totalDownloads,
        uniqueIPs,
        topFiles,
        accessByDate,
      };
    } catch (error) {
      console.error("Error in getAccessLogStats service:", error);
      throw error;
    }
  }
}

export default new AccessLogService();
