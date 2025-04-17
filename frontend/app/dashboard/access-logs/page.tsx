"use client";

import { useState, useEffect } from "react";
import { fetchAccessLogs, fetchLinks } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Eye,
  Download,
  Search,
  CalendarIcon,
  RefreshCw,
  ArrowUpDown,
  Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { LinkType } from "@/types";

interface AccessLogEntry {
  logId: string;
  userId: string;
  linkId: string;
  ipAddress: string;
  userAgent: string;
  accessTime: string; // Changed from timestamp to accessTime
  action: "view" | "download";
  fileName: string;
  fileType: string;
}

export default function AccessLogsPage() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<AccessLogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AccessLogEntry[]>([]);
  const [links, setLinks] = useState<LinkType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [linkFilter, setLinkFilter] = useState("all");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [sortField, setSortField] =
    useState<keyof AccessLogEntry>("accessTime");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  // Stats
  const [totalViews, setTotalViews] = useState(0);
  const [totalDownloads, setTotalDownloads] = useState(0);
  const [uniqueIPs, setUniqueIPs] = useState(0);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch links first to get file names
        const linksData = await fetchLinks();
        setLinks(linksData.links || []);

        // Fetch logs
        const params: any = {};
        if (startDate) params.startDate = startDate.toISOString();
        if (endDate) params.endDate = endDate.toISOString();

        const logsData = await fetchAccessLogs(params);

        // No need for enrichment since the API already includes fileName
        const enrichedLogs = logsData.logs || [];
        setLogs(enrichedLogs);
        setFilteredLogs(enrichedLogs);

        // Calculate stats
        setTotalViews(
          enrichedLogs.filter((log: any) => log.action === "view").length
        );
        setTotalDownloads(
          enrichedLogs.filter((log: any) => log.action === "download").length
        );
        setUniqueIPs(
          new Set(enrichedLogs.map((log: any) => log.ipAddress)).size
        );
      } catch (error: any) {
        console.error("Error loading access logs:", error);
        setError(error.message || "Failed to load access logs");
        toast({
          variant: "destructive",
          title: "Error loading access logs",
          description: "There was a problem loading your access logs.",
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [toast]);

  // Apply filters when any filter changes
  useEffect(() => {
    let filtered = logs;

    // Apply action filter
    if (actionFilter !== "all") {
      filtered = filtered.filter((log) => log.action === actionFilter);
    }

    // Apply link filter
    if (linkFilter !== "all") {
      filtered = filtered.filter((log) => log.linkId === linkFilter);
    }

    // Apply date filters
    if (startDate) {
      filtered = filtered.filter(
        (log) => new Date(log.accessTime) >= startDate
      );
    }
    if (endDate) {
      // Add one day to include the end date fully
      const endDatePlusOne = new Date(endDate);
      endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
      filtered = filtered.filter(
        (log) => new Date(log.accessTime) < endDatePlusOne
      );
    }

    // Apply search filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.ipAddress.toLowerCase().includes(query) ||
          log.fileName?.toLowerCase().includes(query) ||
          log.userAgent.toLowerCase().includes(query)
      );
    }

    // Apply tab filter
    if (activeTab === "views") {
      filtered = filtered.filter((log) => log.action === "view");
    } else if (activeTab === "downloads") {
      filtered = filtered.filter((log) => log.action === "download");
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      if (sortField === "accessTime") {
        // Changed from timestamp to accessTime
        return sortDirection === "asc"
          ? new Date(a.accessTime).getTime() - new Date(b.accessTime).getTime()
          : new Date(b.accessTime).getTime() - new Date(a.accessTime).getTime();
      }

      // For string fields
      if (a[sortField] < b[sortField]) return sortDirection === "asc" ? -1 : 1;
      if (a[sortField] > b[sortField]) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredLogs(filtered);
  }, [
    logs,
    searchQuery,
    actionFilter,
    linkFilter,
    startDate,
    endDate,
    sortField,
    sortDirection,
    activeTab,
  ]);

  const handleSort = (field: keyof AccessLogEntry) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (startDate) params.startDate = startDate.toISOString();
      if (endDate) params.endDate = endDate.toISOString();

      const logsData = await fetchAccessLogs(params);

      // Enrich logs with file names from links
      const enrichedLogs = logsData.logs.map((log: AccessLogEntry) => {
        const link: any = links.find((l) => l.linkId === log.linkId);
        return {
          ...log,
          fileName: link?.fileName || "Unknown File",
        };
      });

      setLogs(enrichedLogs);

      // Calculate stats
      setTotalViews(
        enrichedLogs.filter((log: any) => log.action === "view").length
      );
      setTotalDownloads(
        enrichedLogs.filter((log: any) => log.action === "download").length
      );
      setUniqueIPs(new Set(enrichedLogs.map((log: any) => log.ipAddress)).size);

      toast({
        title: "Logs refreshed",
        description: "Access logs have been refreshed successfully.",
      });
    } catch (error: any) {
      console.error("Error refreshing access logs:", error);
      setError(error.message || "Failed to refresh access logs");
      toast({
        variant: "destructive",
        title: "Error refreshing logs",
        description: "There was a problem refreshing your access logs.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setActionFilter("all");
    setLinkFilter("all");
    setStartDate(undefined);
    setEndDate(undefined);
    setActiveTab("all");
  };

  const renderDeviceInfo = (userAgent: string) => {
    let deviceType = "Unknown";
    let browser = "Unknown";

    // Simple device detection
    if (
      userAgent.includes("Mobile") ||
      userAgent.includes("Android") ||
      userAgent.includes("iPhone")
    ) {
      deviceType = "Mobile";
    } else if (userAgent.includes("Tablet") || userAgent.includes("iPad")) {
      deviceType = "Tablet";
    } else {
      deviceType = "Desktop";
    }

    // Simple browser detection
    if (userAgent.includes("Chrome")) {
      browser = "Chrome";
    } else if (userAgent.includes("Firefox")) {
      browser = "Firefox";
    } else if (userAgent.includes("Safari")) {
      browser = "Safari";
    } else if (userAgent.includes("Edge")) {
      browser = "Edge";
    }

    return `${deviceType} / ${browser}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Access Logs</h1>
          <p className="text-muted-foreground">
            Monitor who accessed your shared files
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={isLoading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Views</CardTitle>
            <CardDescription>Number of file views</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Eye className="mr-2 h-4 w-4 text-primary" />
              <div className="text-2xl font-bold">{totalViews}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Downloads</CardTitle>
            <CardDescription>Number of file downloads</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Download className="mr-2 h-4 w-4 text-primary" />
              <div className="text-2xl font-bold">{totalDownloads}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Unique Visitors</CardTitle>
            <CardDescription>Based on IP addresses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Info className="mr-2 h-4 w-4 text-primary" />
              <div className="text-2xl font-bold">{uniqueIPs}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs
        defaultValue="all"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="all">All Logs</TabsTrigger>
          <TabsTrigger value="views">Views</TabsTrigger>
          <TabsTrigger value="downloads">Downloads</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="space-y-4">
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search logs..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="view">Views</SelectItem>
                <SelectItem value="download">Downloads</SelectItem>
              </SelectContent>
            </Select>
            <Select value={linkFilter} onValueChange={setLinkFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by file" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Files</SelectItem>
                {links.map((link: LinkType) => (
                  <SelectItem key={link.linkId} value={link.linkId}>
                    {"Unnamed File"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Start Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "End Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {(searchQuery ||
              actionFilter !== "all" ||
              linkFilter !== "all" ||
              startDate ||
              endDate) && (
              <Button variant="ghost" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>

          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
              <Info className="h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No logs found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                No access logs match your current filters.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("accessTime")} // Changed from timestamp to accessTime
                        className="flex items-center gap-1 px-0 font-medium"
                      >
                        Timestamp
                        <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>File</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Device Info
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log: AccessLogEntry) => (
                    <TableRow key={log.logId}>
                      <TableCell className="font-medium">
                        {formatDate(log.accessTime)}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help">
                                {log.fileName || "Unknown File"}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{log.fileName || "Unknown File"}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            log.action === "view" ? "outline" : "default"
                          }
                          className="gap-1"
                        >
                          {log.action === "view" ? (
                            <Eye className="h-3 w-3" />
                          ) : (
                            <Download className="h-3 w-3" />
                          )}
                          {log.action === "view" ? "Viewed" : "Downloaded"}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.ipAddress}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help">
                                {renderDeviceInfo(log.userAgent)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p className="text-xs">{log.userAgent}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
        <TabsContent value="views" className="space-y-4">
          {/* Same content as "all" tab but filtered for views */}
          {/* This is handled by the useEffect filter */}
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search logs..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={linkFilter} onValueChange={setLinkFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by file" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Files</SelectItem>
                {links.map((link: LinkType) => (
                  <SelectItem key={link.linkId} value={link.linkId}>
                    {"Unnamed File"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Start Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "End Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {(searchQuery || linkFilter !== "all" || startDate || endDate) && (
              <Button variant="ghost" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>

          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
              <Eye className="h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No view logs found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                No file view logs match your current filters.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("accessTime")}
                        className="flex items-center gap-1 px-0 font-medium"
                      >
                        Timestamp
                        <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>File</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Device Info
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log: AccessLogEntry) => (
                    <TableRow key={log.logId}>
                      <TableCell className="font-medium">
                        {formatDate(log.accessTime)}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help">
                                {log.fileName || "Unknown File"}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{log.fileName || "Unknown File"}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>{log.ipAddress}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help">
                                {renderDeviceInfo(log.userAgent)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p className="text-xs">{log.userAgent}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
        <TabsContent value="downloads" className="space-y-4">
          {/* Same content as "all" tab but filtered for downloads */}
          {/* This is handled by the useEffect filter */}
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search logs..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={linkFilter} onValueChange={setLinkFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by file" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Files</SelectItem>
                {links.map((link: LinkType) => (
                  <SelectItem key={link.linkId} value={link.linkId}>
                    {"Unnamed File"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Start Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "End Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {(searchQuery || linkFilter !== "all" || startDate || endDate) && (
              <Button variant="ghost" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>

          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
              <Download className="h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">
                No download logs found
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                No file download logs match your current filters.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("accessTime")}
                        className="flex items-center gap-1 px-0 font-medium"
                      >
                        Timestamp
                        <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>File</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Device Info
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log: AccessLogEntry) => (
                    <TableRow key={log.logId}>
                      <TableCell className="font-medium">
                        {formatDate(log.accessTime)}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help">
                                {log.fileName || "Unknown File"}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{log.fileName || "Unknown File"}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>{log.ipAddress}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help">
                                {renderDeviceInfo(log.userAgent)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p className="text-xs">{log.userAgent}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
