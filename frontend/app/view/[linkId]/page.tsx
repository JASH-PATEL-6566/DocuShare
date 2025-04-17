"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileViewer } from "@/components/file-viewer";
import {
  getPublicLinkInfo,
  getFileContent,
  verifyLinkPassword,
} from "@/lib/api";
import { formatBytes, formatDate } from "@/lib/utils";
import { AlertCircle, Eye, Lock, FileIcon, RefreshCcw } from "lucide-react";

interface LinkInfo {
  linkId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  requiresPassword: boolean; // Changed from hasPassword to requiresPassword
  allowDownload: boolean;
  expiryTimestamp: string;
  status: "active" | "revoked" | "expired";
  viewsSoFar?: number; // Changed from viewCount to viewsSoFar
  viewLimit?: number;
  downloadsSoFar?: number; // Changed from downloadCount to downloadsSoFar
  downloadLimit?: number;
  downloadUrl?: string;
}

export default function ViewFilePage() {
  const { linkId } = useParams() as { linkId: string };
  const [linkInfo, setLinkInfo] = useState<LinkInfo | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [fileData, setFileData] = useState<any>(null);

  // Function to fetch link info
  const fetchLinkInfo = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getPublicLinkInfo(linkId);
      setLinkInfo(data);

      // If the file has a password, show the password form
      // Otherwise, mark as verified (which will trigger content fetch)
      if (data.requiresPassword) {
        setShowPasswordForm(true);
        setIsPasswordVerified(false);
      } else {
        setIsPasswordVerified(true);
      }
    } catch (error: any) {
      console.error("Error fetching link info:", error);
      setError(error.message || "This link is invalid or has expired.");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch file content
  const fetchFileContent = async () => {
    if (linkInfo) {
      try {
        setIsLoading(true);

        // Only send password if the file is password protected and we've verified it
        const passwordToUse =
          linkInfo.requiresPassword && isPasswordVerified
            ? password
            : undefined;
        console.log(
          "Fetching file content with password:",
          passwordToUse ? "Yes" : "No"
        );

        const fileData = await getFileContent(linkId, passwordToUse);
        console.log("File content received:", fileData);

        // Store the full file data
        setFileData(fileData);

        // Use viewUrl if fileUrl is not available
        setFileUrl(fileData.fileUrl || fileData.viewUrl);
        setError(null);
      } catch (error: any) {
        console.error("Error fetching file content:", error);

        if (error.message === "Password required" || error.status === 401) {
          setIsPasswordVerified(false);
          setShowPasswordForm(true);
          setError("This file requires a password.");
        } else {
          setError(error.message || "Failed to load file content.");
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Initial load of link info
  useEffect(() => {
    if (linkId) {
      fetchLinkInfo();
    }
  }, [linkId, retryCount]);

  // Load file content when password is verified or when the file doesn't need a password
  useEffect(() => {
    // Only attempt to fetch file content if:
    // 1. We have link info
    // 2. AND EITHER:
    //    a. The file doesn't have a password, OR
    //    b. The file has a password AND the password has been verified
    if (linkInfo && !linkInfo.requiresPassword) {
      fetchFileContent();
    }
  }, [linkInfo, isPasswordVerified]);

  const handleVerifyPassword = async () => {
    if (!password.trim()) return;

    setIsVerifying(true);
    setError(null);

    try {
      const result = await verifyLinkPassword(linkId, password);

      if (result.success) {
        setIsPasswordVerified(true);
        setShowPasswordForm(false);
        setFileUrl(result.viewUrl);
      } else {
        setError("Incorrect password. Please try again.");
      }
    } catch (error: any) {
      console.error("Error verifying password:", error);
      setError(error.message || "Failed to verify password. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleShowPasswordForm = () => {
    setShowPasswordForm(true);
    setError(null);
  };

  const handleRetry = () => {
    // Reset states
    setError(null);
    setIsPasswordVerified(false);
    setShowPasswordForm(false);
    setPassword("");

    // Increment retry count to trigger useEffects
    setRetryCount((prev) => prev + 1);
  };

  if (isLoading && !linkInfo) {
    return (
      <div className="container max-w-full py-10 px-4">
        <Card className="w-full">
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[400px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !linkInfo) {
    return (
      <div className="container max-w-full py-10 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error || "Failed to load file information."}
          </AlertDescription>
        </Alert>
        <div className="flex justify-center mt-4">
          <Button onClick={handleRetry} className="gap-2">
            <RefreshCcw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!linkInfo) {
    return (
      <div className="container max-w-full py-10 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Failed to load file information.</AlertDescription>
        </Alert>
        <div className="flex justify-center mt-4">
          <Button onClick={handleRetry} className="gap-2">
            <RefreshCcw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (linkInfo.status === "revoked") {
    return (
      <div className="container max-w-full py-10 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Link Revoked</AlertTitle>
          <AlertDescription>
            This sharing link has been revoked by the owner.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (linkInfo.status === "expired") {
    return (
      <div className="container max-w-full py-10 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Link Expired</AlertTitle>
          <AlertDescription>This sharing link has expired.</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Check if view limit is reached
  if (
    linkInfo.viewLimit &&
    linkInfo.viewsSoFar &&
    linkInfo.viewsSoFar >= linkInfo.viewLimit
  ) {
    return (
      <div className="container max-w-full py-10 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>View Limit Reached</AlertTitle>
          <AlertDescription>
            This file has reached its maximum number of views.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Determine if download is allowed
  const isDownloadAllowed = linkInfo.allowDownload;

  return (
    <div className="container max-w-full py-10 px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileIcon className="h-5 w-5" />
            {linkInfo.fileName}
          </CardTitle>
          <CardDescription>
            {formatBytes(linkInfo.fileSize)} • Shared until{" "}
            {formatDate(linkInfo.expiryTimestamp)}
          </CardDescription>
          {linkInfo.viewLimit && (
            <CardDescription className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {linkInfo.viewsSoFar || 0} of {linkInfo.viewLimit} views
            </CardDescription>
          )}
        </CardHeader>

        <CardContent>
          {showPasswordForm ? (
            <div className="flex flex-col items-center justify-center p-10 space-y-4">
              <div className="rounded-full bg-muted p-3">
                <Lock className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-medium">
                This file is password protected
              </h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Enter the password provided by the file owner to access this
                file.
              </p>
              <div className="flex w-full max-w-sm items-center space-x-2">
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleVerifyPassword()}
                />
                <Button
                  onClick={handleVerifyPassword}
                  disabled={isVerifying || !password.trim()}
                >
                  {isVerifying ? "Verifying..." : "Verify"}
                </Button>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          ) : isLoading ? (
            <div className="flex justify-center items-center h-[400px]">
              <Skeleton className="h-full w-full" />
            </div>
          ) : fileUrl ? (
            <FileViewer
              fileUrl={fileUrl}
              fileType={linkInfo.fileType}
              fileName={linkInfo.fileName}
              allowDownload={isDownloadAllowed}
              onRetry={fetchFileContent}
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-10 space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {error || "Failed to load file content."}
                </AlertDescription>
              </Alert>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                <Button onClick={handleRetry} className="gap-2">
                  <RefreshCcw className="h-4 w-4" />
                  Retry
                </Button>
                {linkInfo.requiresPassword && (
                  <Button onClick={handleShowPasswordForm}>
                    Enter Password
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
