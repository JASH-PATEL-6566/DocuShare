// "use client";

// import { useState } from "react";
// import type { FileType, LinkType } from "@/types";
// import { formatBytes, formatDate } from "@/lib/utils";
// import { Button } from "@/components/ui/button";
// import { useToast } from "@/components/ui/use-toast";
// import { deleteFile, getDownloadUrl } from "@/lib/api";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { CreateLinkDialog } from "@/components/create-link-dialog";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import {
//   Download,
//   Link,
//   MoreHorizontal,
//   Trash,
//   FileIcon,
//   FileText,
//   FileImage,
//   FileAudio,
//   FileVideo,
//   FileIcon as FilePdf,
//   FileArchive,
//   FileCode,
// } from "lucide-react";

// interface FileListProps {
//   files: FileType[];
//   onDelete: (fileId: string) => void;
//   onCreateLink: (fileId: string, link: LinkType) => void;
// }

// export function FileList({ files, onDelete, onCreateLink }: FileListProps) {
//   const { toast } = useToast();
//   const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
//   const [selectedFile, setSelectedFile] = useState<FileType | null>(null);
//   const [isCreateLinkOpen, setIsCreateLinkOpen] = useState(false);

//   const getFileIcon = (fileType: string) => {
//     if (fileType.startsWith("image/")) return FileImage;
//     if (fileType.startsWith("audio/")) return FileAudio;
//     if (fileType.startsWith("video/")) return FileVideo;
//     if (fileType === "application/pdf") return FilePdf;
//     if (fileType.includes("zip") || fileType.includes("compressed"))
//       return FileArchive;
//     if (
//       fileType.includes("html") ||
//       fileType.includes("javascript") ||
//       fileType.includes("css")
//     )
//       return FileCode;
//     if (fileType.includes("text/")) return FileText;
//     return FileIcon;
//   };

//   const handleDownload = async (fileId: string) => {
//     setIsLoading((prev) => ({ ...prev, [fileId]: true }));
//     try {
//       const data = await getDownloadUrl(fileId);
//       // Create a temporary link and trigger download
//       const link = document.createElement("a");
//       link.href = data.downloadUrl;
//       link.setAttribute("download", "");
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);

//       // Add a toast notification for successful download
//       toast({
//         title: "Download started",
//         description: "Your file download has started successfully.",
//         variant: "default",
//       });
//     } catch (error) {
//       console.error("Error downloading file:", error);
//       toast({
//         variant: "destructive",
//         title: "Download failed",
//         description: "There was a problem downloading your file.",
//       });
//     } finally {
//       setIsLoading((prev) => ({ ...prev, [fileId]: false }));
//     }
//   };

//   const handleDelete = async (fileId: string) => {
//     setIsLoading((prev) => ({ ...prev, [fileId]: true }));
//     try {
//       await deleteFile(fileId);
//       onDelete(fileId);
//       toast({
//         title: "File deleted",
//         description: "Your file has been deleted successfully.",
//         variant: "default",
//       });
//     } catch (error) {
//       console.error("Error deleting file:", error);
//       toast({
//         variant: "destructive",
//         title: "Deletion failed",
//         description: "There was a problem deleting your file.",
//       });
//     } finally {
//       setIsLoading((prev) => ({ ...prev, [fileId]: false }));
//     }
//   };

//   const handleCreateLink = (file: FileType) => {
//     setSelectedFile(file);
//     setIsCreateLinkOpen(true);
//   };

//   const handleLinkCreated = (link: LinkType) => {
//     if (selectedFile) {
//       onCreateLink(selectedFile.fileId, link);
//       // Remove the following line to prevent auto-closing
//       // setIsCreateLinkOpen(false);
//       // setSelectedFile(null);
//     }
//   };

//   if (files.length === 0) {
//     return (
//       <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
//         <FileIcon className="h-10 w-10 text-muted-foreground" />
//         <h3 className="mt-4 text-lg font-semibold">No files found</h3>
//         <p className="mt-2 text-sm text-muted-foreground">
//           Upload files to get started.
//         </p>
//       </div>
//     );
//   }

//   return (
//     <>
//       <div className="rounded-md border">
//         <Table>
//           <TableHeader>
//             <TableRow>
//               <TableHead>Name</TableHead>
//               <TableHead>Type</TableHead>
//               <TableHead>Size</TableHead>
//               <TableHead>Uploaded</TableHead>
//               <TableHead className="w-[100px]">Actions</TableHead>
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {files.map((file) => {
//               const FileIconComponent = getFileIcon(file.fileType);
//               return (
//                 <TableRow key={file.fileId}>
//                   <TableCell className="font-medium">
//                     <div className="flex items-center gap-2">
//                       <FileIconComponent className="h-4 w-4 text-muted-foreground" />
//                       <span className="truncate max-w-[200px]">
//                         {file.fileName}
//                       </span>
//                     </div>
//                   </TableCell>
//                   <TableCell>
//                     {file.fileType.split("/")[1] || file.fileType}
//                   </TableCell>
//                   <TableCell>{formatBytes(file.fileSize)}</TableCell>
//                   <TableCell>{formatDate(file.uploadTime)}</TableCell>
//                   <TableCell>
//                     <DropdownMenu>
//                       <DropdownMenuTrigger asChild>
//                         <Button variant="ghost" size="icon">
//                           <MoreHorizontal className="h-4 w-4" />
//                           <span className="sr-only">Actions</span>
//                         </Button>
//                       </DropdownMenuTrigger>
//                       <DropdownMenuContent align="end">
//                         <DropdownMenuItem
//                           onClick={() => handleDownload(file.fileId)}
//                           disabled={isLoading[file.fileId]}
//                         >
//                           <Download className="mr-2 h-4 w-4" />
//                           Download
//                         </DropdownMenuItem>
//                         <DropdownMenuItem
//                           onClick={() => handleCreateLink(file)}
//                         >
//                           <Link className="mr-2 h-4 w-4" />
//                           Create Link
//                         </DropdownMenuItem>
//                         <DropdownMenuItem
//                           onClick={() => handleDelete(file.fileId)}
//                           disabled={isLoading[file.fileId]}
//                           className="text-destructive focus:text-destructive"
//                         >
//                           <Trash className="mr-2 h-4 w-4" />
//                           Delete
//                         </DropdownMenuItem>
//                       </DropdownMenuContent>
//                     </DropdownMenu>
//                   </TableCell>
//                 </TableRow>
//               );
//             })}
//           </TableBody>
//         </Table>
//       </div>

//       {selectedFile && (
//         <CreateLinkDialog
//           file={selectedFile}
//           open={isCreateLinkOpen}
//           onOpenChange={setIsCreateLinkOpen}
//           onLinkCreated={handleLinkCreated}
//         />
//       )}
//     </>
//   );
// }
"use client";

import { useState } from "react";
import type { FileType, LinkType } from "@/types";
import { formatBytes, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { deleteFile, getDownloadUrl } from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateLinkDialog } from "@/components/create-link-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Download,
  Link,
  MoreHorizontal,
  Trash,
  FileIcon,
  FileText,
  FileImage,
  FileAudio,
  FileVideo,
  FileIcon as FilePdf,
  FileArchive,
  FileCode,
} from "lucide-react";

interface FileListProps {
  files: FileType[];
  onDelete: (fileId: string) => void;
  onCreateLink: (fileId: string, link: LinkType) => void;
}

export function FileList({ files, onDelete, onCreateLink }: FileListProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [selectedFile, setSelectedFile] = useState<FileType | null>(null);
  const [isCreateLinkOpen, setIsCreateLinkOpen] = useState(false);

  // Update the getFileIcon function to handle undefined fileType
  const getFileIcon = (fileType: string | undefined) => {
    if (!fileType) return FileIcon;
    if (fileType.startsWith("image/")) return FileImage;
    if (fileType.startsWith("audio/")) return FileAudio;
    if (fileType.startsWith("video/")) return FileVideo;
    if (fileType === "application/pdf") return FilePdf;
    if (fileType.includes("zip") || fileType.includes("compressed"))
      return FileArchive;
    if (
      fileType.includes("html") ||
      fileType.includes("javascript") ||
      fileType.includes("css")
    )
      return FileCode;
    if (fileType.includes("text/")) return FileText;
    return FileIcon;
  };

  const handleDownload = async (fileId: string) => {
    setIsLoading((prev) => ({ ...prev, [fileId]: true }));
    try {
      const data = await getDownloadUrl(fileId);
      // Create a temporary link and trigger download
      const link = document.createElement("a");
      link.href = data.downloadUrl;
      link.setAttribute("download", "");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Add a toast notification for successful download
      toast({
        title: "Download started",
        description: "Your file download has started successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error downloading file:", error);
      toast({
        variant: "destructive",
        title: "Download failed",
        description: "There was a problem downloading your file.",
      });
    } finally {
      setIsLoading((prev) => ({ ...prev, [fileId]: false }));
    }
  };

  const handleDelete = async (fileId: string) => {
    setIsLoading((prev) => ({ ...prev, [fileId]: true }));
    try {
      await deleteFile(fileId);
      onDelete(fileId);
      toast({
        title: "File deleted",
        description: "Your file has been deleted successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error deleting file:", error);
      toast({
        variant: "destructive",
        title: "Deletion failed",
        description: "There was a problem deleting your file.",
      });
    } finally {
      setIsLoading((prev) => ({ ...prev, [fileId]: false }));
    }
  };

  const handleCreateLink = (file: FileType) => {
    setSelectedFile(file);
    setIsCreateLinkOpen(true);
  };

  const handleLinkCreated = (link: LinkType) => {
    if (selectedFile) {
      onCreateLink(selectedFile.fileId, link);
      // Remove the following line to prevent auto-closing
      // setIsCreateLinkOpen(false);
      // setSelectedFile(null);
    }
  };

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <FileIcon className="h-10 w-10 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No files found</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Upload files to get started.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.map((file) => {
              const FileIconComponent = getFileIcon(file.fileType);
              return (
                <TableRow key={file.fileId}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <FileIconComponent className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate max-w-[200px]">
                        {file.fileName}
                      </span>
                    </div>
                  </TableCell>
                  {/* Also update the TableCell that displays the file type to handle undefined fileType */}
                  <TableCell>
                    {file.fileType
                      ? file.fileType.split("/")[1] || file.fileType
                      : "Unknown"}
                  </TableCell>
                  <TableCell>{formatBytes(file.fileSize)}</TableCell>
                  <TableCell>{formatDate(file.uploadTime)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleDownload(file.fileId)}
                          disabled={isLoading[file.fileId]}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleCreateLink(file)}
                        >
                          <Link className="mr-2 h-4 w-4" />
                          Create Link
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(file.fileId)}
                          disabled={isLoading[file.fileId]}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {selectedFile && (
        <CreateLinkDialog
          file={selectedFile}
          open={isCreateLinkOpen}
          onOpenChange={setIsCreateLinkOpen}
          onLinkCreated={handleLinkCreated}
        />
      )}
    </>
  );
}
