"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileList } from "@/components/file-list";
import { LinkList } from "@/components/link-list";
import { UploadButton } from "@/components/upload-button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/auth-context";
import type { FileType, LinkType } from "@/types";
import { fetchFiles, fetchLinks } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { toast } = useToast();
  const {
    user,
    isAuthenticated,
    isLoading: authLoading,
    authError,
    refreshUser,
  } = useAuth();
  const [files, setFiles] = useState<FileType[]>([]);
  const [links, setLinks] = useState<LinkType[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);

  // Load data function
  const loadData = async () => {
    console.log("Dashboard: Loading data...");
    setIsDataLoading(true);
    setDataError(null);

    try {
      // Check if we have a token
      const token =
        typeof window !== "undefined" ? sessionStorage.getItem("token") : null;

      if (!token) {
        console.log("Dashboard: No token found, skipping data load");
        setDataError("Authentication required. Please log in.");
        setIsDataLoading(false);
        return;
      }

      console.log("Dashboard: Token found, fetching data...");
      const [filesData, linksData] = await Promise.all([
        fetchFiles(),
        fetchLinks(),
      ]);

      console.log("Dashboard: Data fetched successfully");
      setFiles(filesData.files || []);
      setLinks(linksData.links || []);
      setHasAttemptedLoad(true);
    } catch (error: any) {
      console.error("Dashboard: Error loading data:", error);

      // If we get a 500 error, show a specific message
      if (error.status === 500) {
        setDataError(
          "The server encountered an error. Please try again later."
        );
      } else {
        setDataError(
          error.message ||
            "Failed to load data. Please check your connection and try again."
        );
      }

      toast({
        variant: "destructive",
        title: "Error loading data",
        description: "There was a problem loading your files and links.",
      });
    } finally {
      setIsDataLoading(false);
    }
  };

  // Effect to load data when auth state changes
  useEffect(() => {
    console.log("Dashboard: Auth state changed", {
      authLoading,
      isAuthenticated,
      hasToken:
        typeof window !== "undefined" && !!sessionStorage.getItem("token"),
      hasAttemptedLoad,
    });

    // Only load data if:
    // 1. Auth is not loading AND
    // 2. Either user is authenticated OR we have a token AND
    // 3. We haven't already attempted to load data
    if (!authLoading && !hasAttemptedLoad) {
      const hasToken =
        typeof window !== "undefined" && !!sessionStorage.getItem("token");

      if (isAuthenticated || hasToken) {
        console.log("Dashboard: Conditions met, loading data");
        loadData();
      } else {
        console.log("Dashboard: Auth conditions not met, not loading data");
        setIsDataLoading(false);
      }
    }
  }, [authLoading, isAuthenticated, hasAttemptedLoad]);

  // Handle retry for both auth and data errors
  const handleRetry = async () => {
    if (authError) {
      // If there's an auth error, try refreshing the user first
      await refreshUser();
    }

    // Then reload the data
    loadData();
  };

  // Show loading state
  if (authLoading || (isDataLoading && !hasAttemptedLoad)) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>

        <Tabs defaultValue="files" className="space-y-4">
          <TabsList>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="links">Shared Links</TabsTrigger>
          </TabsList>
          <TabsContent value="files" className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Show error state
  if (authError || dataError) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your files and shared links
            </p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{authError || dataError}</AlertDescription>
        </Alert>

        <div className="flex justify-center">
          <Button onClick={handleRetry} className="gap-2">
            <RefreshCcw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Show dashboard content
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your files and shared links
          </p>
        </div>
        <UploadButton
          onUploadComplete={(file) => setFiles((prev) => [file, ...prev])}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total Files</CardTitle>
            <CardDescription>Your uploaded files</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{files.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Active Links</CardTitle>
            <CardDescription>Your shared links</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {links.filter((link) => link.status === "active").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Subscription</CardTitle>
            <CardDescription>Your current plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold capitalize">
              {user?.subscriptionId || "Free"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="files" className="space-y-4">
        <TabsList>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="links">Shared Links</TabsTrigger>
        </TabsList>
        <TabsContent value="files" className="space-y-4">
          <FileList
            files={files}
            onDelete={(fileId) =>
              setFiles(files.filter((file) => file.fileId !== fileId))
            }
            onCreateLink={(fileId, link) => setLinks((prev) => [link, ...prev])}
          />
        </TabsContent>
        <TabsContent value="links" className="space-y-4">
          <LinkList
            links={links}
            onDelete={(linkId) =>
              setLinks(links.filter((link) => link.linkId !== linkId))
            }
            onUpdate={(updatedLink) => {
              setLinks(
                links.map((link) =>
                  link.linkId === updatedLink.linkId ? updatedLink : link
                )
              );
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
