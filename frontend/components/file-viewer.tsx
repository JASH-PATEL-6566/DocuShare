"use client";

import { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  FileText,
  ImageIcon,
  FileIcon,
  AlertCircle,
  Maximize,
  Minimize,
  RefreshCcw,
} from "lucide-react";

interface FileViewerProps {
  fileUrl: string;
  fileType: string;
  fileName: string;
  allowDownload?: boolean;
  onRetry?: () => void;
}

export function FileViewer({
  fileUrl,
  fileType,
  fileName,
  allowDownload = false,
  onRetry,
}: FileViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<"preview" | "download">("preview");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    // Check if the URL is valid
    if (!fileUrl) {
      setError("File URL is missing or invalid");
      setIsLoading(false);
      return;
    }

    // Validate URL format
    try {
      new URL(fileUrl); // This will throw if the URL is invalid
    } catch (e) {
      setError("Invalid file URL format");
      setIsLoading(false);
      return;
    }

    // Reset error when fileUrl changes
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [fileUrl, retryCount]);

  // Handle iframe load event
  const handleIframeLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  // Handle iframe error
  const handleIframeError = () => {
    setError(
      "Failed to load file. The file might be corrupted or in an unsupported format."
    );
    setIsLoading(false);
  };

  // Handle image error
  const handleImageError = () => {
    setError(
      "Failed to load image. The image might be corrupted or in an unsupported format."
    );
    setIsLoading(false);
  };

  // Handle video error
  const handleVideoError = () => {
    setError(
      "Failed to load video. The video might be corrupted or in an unsupported format."
    );
    setIsLoading(false);
  };

  // Handle audio error
  const handleAudioError = () => {
    setError(
      "Failed to load audio. The audio might be corrupted or in an unsupported format."
    );
    setIsLoading(false);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .then(() => {
          setIsFullscreen(true);
        })
        .catch((err) => {
          console.error(
            `Error attempting to enable fullscreen: ${err.message}`
          );
        });
    } else {
      if (document.exitFullscreen) {
        document
          .exitFullscreen()
          .then(() => {
            setIsFullscreen(false);
          })
          .catch((err) => {
            console.error(
              `Error attempting to exit fullscreen: ${err.message}`
            );
          });
      }
    }
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      // If no external retry handler, just increment retry count to trigger useEffect
      setRetryCount((prev) => prev + 1);
    }
  };

  const renderFilePreview = () => {
    if (isLoading) {
      return <Skeleton className="h-[400px] w-full" />;
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center p-10 space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error loading file</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={handleRetry} className="gap-2">
            <RefreshCcw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      );
    }

    // Handle different file types
    if (fileType.startsWith("image/")) {
      return (
        <div className="flex justify-center">
          <img
            src={fileUrl || "/placeholder.svg"}
            alt={fileName}
            className="max-h-[600px] object-contain"
            onError={handleImageError}
          />
        </div>
      );
    }

    if (fileType === "application/pdf") {
      return (
        <div className="h-[600px] w-full bg-white">
          <iframe
            ref={iframeRef}
            src={`${fileUrl}#toolbar=1&view=FitH`}
            className="h-full w-full border-0"
            title={fileName}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          />
        </div>
      );
    }

    if (fileType.startsWith("text/") || fileType === "application/json") {
      return (
        <iframe
          src={fileUrl}
          className="h-[600px] w-full border-0 bg-white"
          title={fileName}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
        />
      );
    }

    if (fileType.startsWith("video/")) {
      return (
        <div className="flex justify-center">
          <video
            src={fileUrl}
            controls
            className="max-h-[600px] max-w-full"
            onError={handleVideoError}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    if (fileType.startsWith("audio/")) {
      return (
        <div className="flex justify-center p-10">
          <audio
            src={fileUrl}
            controls
            className="w-full"
            onError={handleAudioError}
          >
            Your browser does not support the audio tag.
          </audio>
        </div>
      );
    }

    // For unsupported file types, try to use Google Docs Viewer as a fallback
    if (
      fileType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || // .docx
      fileType === "application/msword" || // .doc
      fileType ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || // .xlsx
      fileType === "application/vnd.ms-excel" || // .xls
      fileType ===
        "application/vnd.openxmlformats-officedocument.presentationml.presentation" || // .pptx
      fileType === "application/vnd.ms-powerpoint" // .ppt
    ) {
      const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(
        fileUrl
      )}&embedded=true`;
      return (
        <div className="h-[600px] w-full">
          <iframe
            src={googleDocsUrl}
            className="h-full w-full border-0"
            title={fileName}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          />
        </div>
      );
    }

    // For other unsupported file types
    return (
      <div className="flex flex-col items-center justify-center p-10 space-y-4">
        <div className="rounded-full bg-muted p-3">
          <FileIcon className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-medium">Preview not available</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          This file type cannot be previewed in the browser. Please download the
          file to view it.
        </p>
      </div>
    );
  };

  // Determine if we should show the download tab
  const showDownloadTab = allowDownload;

  return (
    <div className="relative w-full">
      <div className="absolute top-2 right-2 z-10">
        <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
          {isFullscreen ? (
            <Minimize className="h-4 w-4" />
          ) : (
            <Maximize className="h-4 w-4" />
          )}
        </Button>
      </div>

      <Tabs
        defaultValue="preview"
        className="w-full"
        onValueChange={(value) => setActiveTab(value as any)}
      >
        <TabsList
          className={`grid w-full ${
            showDownloadTab ? "grid-cols-2" : "grid-cols-1"
          }`}
        >
          <TabsTrigger value="preview" className="gap-2">
            <FileText className="h-4 w-4" />
            Preview
          </TabsTrigger>
          {showDownloadTab && (
            <TabsTrigger value="download" className="gap-2">
              <ImageIcon className="h-4 w-4" />
              Download
            </TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="preview" className="border rounded-md mt-2">
          {renderFilePreview()}
        </TabsContent>
        {showDownloadTab && (
          <TabsContent value="download" className="border rounded-md mt-2 p-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="rounded-full bg-muted p-3">
                <FileIcon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-medium">{fileName}</h3>
              <p className="text-sm text-muted-foreground text-center">
                Click the button below to download this file.
              </p>
              <Button asChild>
                <a href={fileUrl} download={fileName}>
                  Download File
                </a>
              </Button>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
