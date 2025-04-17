// "use client";

// import type React from "react";

// import { useState, useRef } from "react";
// import { Button } from "@/components/ui/button";
// import { useToast } from "@/components/ui/use-toast";
// import { uploadFile } from "@/lib/api";
// import type { FileType } from "@/types";
// import { Upload, Loader2 } from "lucide-react";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import { Progress } from "@/components/ui/progress";

// interface UploadButtonProps {
//   onUploadComplete: (file: FileType) => void;
// }

// export function UploadButton({ onUploadComplete }: UploadButtonProps) {
//   const { toast } = useToast();
//   const [isUploading, setIsUploading] = useState(false);
//   const [uploadProgress, setUploadProgress] = useState(0);
//   const [selectedFile, setSelectedFile] = useState<File | null>(null);
//   const [isDialogOpen, setIsDialogOpen] = useState(false);
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files[0]) {
//       setSelectedFile(e.target.files[0]);
//     }
//   };

//   const handleUpload = async () => {
//     if (!selectedFile) return;

//     setIsUploading(true);
//     setUploadProgress(0);

//     try {
//       // Direct upload to server
//       const fileData = await uploadFile(selectedFile, (progress) => {
//         setUploadProgress(progress);
//       });

//       onUploadComplete(fileData);
//       setIsDialogOpen(false);
//       setSelectedFile(null);
//       if (fileInputRef.current) {
//         fileInputRef.current.value = "";
//       }

//       toast({
//         title: "Upload complete",
//         description: "Your file has been uploaded successfully.",
//         variant: "default",
//       });
//     } catch (error) {
//       console.error("Upload error:", error);
//       toast({
//         variant: "destructive",
//         title: "Upload failed",
//         description:
//           error instanceof Error
//             ? error.message
//             : "There was a problem uploading your file.",
//       });
//     } finally {
//       setIsUploading(false);
//       setUploadProgress(0);
//     }
//   };

//   return (
//     <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//       <DialogTrigger asChild>
//         <Button>
//           <Upload className="mr-2 h-4 w-4" />
//           Upload File
//         </Button>
//       </DialogTrigger>
//       <DialogContent>
//         <DialogHeader>
//           <DialogTitle>Upload File</DialogTitle>
//           <DialogDescription>
//             Select a file to upload to your account.
//           </DialogDescription>
//         </DialogHeader>
//         <div className="grid gap-4 py-4">
//           <div className="grid gap-2">
//             <input
//               ref={fileInputRef}
//               type="file"
//               className="cursor-pointer rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium"
//               onChange={handleFileChange}
//               disabled={isUploading}
//             />
//             {selectedFile && (
//               <p className="text-sm text-muted-foreground">
//                 Selected: {selectedFile.name} (
//                 {Math.round(selectedFile.size / 1024)} KB)
//               </p>
//             )}
//             {isUploading && (
//               <div className="space-y-2">
//                 <Progress value={uploadProgress} />
//                 <p className="text-sm text-muted-foreground text-center">
//                   Uploading... {uploadProgress}%
//                 </p>
//               </div>
//             )}
//           </div>
//         </div>
//         <DialogFooter>
//           <Button
//             variant="outline"
//             onClick={() => setIsDialogOpen(false)}
//             disabled={isUploading}
//           >
//             Cancel
//           </Button>
//           <Button
//             onClick={handleUpload}
//             disabled={!selectedFile || isUploading}
//           >
//             {isUploading ? (
//               <>
//                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                 Uploading
//               </>
//             ) : (
//               "Upload"
//             )}
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// }
"use client";

import type React from "react";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { uploadFile } from "@/lib/api";
import type { FileType } from "@/types";
import { Upload, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

interface UploadButtonProps {
  onUploadComplete: (file: FileType) => void;
}

export function UploadButton({ onUploadComplete }: UploadButtonProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Direct upload to server
      const fileData = await uploadFile(selectedFile, (progress) => {
        setUploadProgress(progress);
      });

      // Ensure fileData has all required properties
      const completeFileData = {
        ...fileData,
        fileType:
          fileData.fileType || selectedFile.type || "application/octet-stream",
        fileName: fileData.fileName || selectedFile.name,
        fileSize: fileData.fileSize || selectedFile.size,
      };

      console.log(completeFileData);

      onUploadComplete(completeFileData);
      setIsDialogOpen(false);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      toast({
        title: "Upload complete",
        description: "Your file has been uploaded successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description:
          error instanceof Error
            ? error.message
            : "There was a problem uploading your file.",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload File
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload File</DialogTitle>
          <DialogDescription>
            Select a file to upload to your account.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="cursor-pointer rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            {selectedFile && (
              <p className="text-sm text-muted-foreground">
                Selected: {selectedFile.name} (
                {Math.round(selectedFile.size / 1024)} KB)
              </p>
            )}
            {isUploading && (
              <div className="space-y-2">
                <Progress value={uploadProgress} />
                <p className="text-sm text-muted-foreground text-center">
                  Uploading... {uploadProgress}%
                </p>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsDialogOpen(false)}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading
              </>
            ) : (
              "Upload"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
