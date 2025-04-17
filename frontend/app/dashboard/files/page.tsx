"use client"

import { useEffect, useState } from "react"
import { FileList } from "@/components/file-list"
import { UploadButton } from "@/components/upload-button"
import { useToast } from "@/components/ui/use-toast"
import type { FileType, LinkType } from "@/types"
import { fetchFiles } from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export default function FilesPage() {
  const { toast } = useToast()
  const [files, setFiles] = useState<FileType[]>([])
  const [filteredFiles, setFilteredFiles] = useState<FileType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    async function loadFiles() {
      setIsLoading(true)
      try {
        const data = await fetchFiles()
        setFiles(data.files)
        setFilteredFiles(data.files)
      } catch (error) {
        console.error("Error loading files:", error)
        toast({
          variant: "destructive",
          title: "Error loading files",
          description: "There was a problem loading your files.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadFiles()
  }, [toast])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredFiles(files)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredFiles(
        files.filter(
          (file) => file.fileName.toLowerCase().includes(query) || file.fileType.toLowerCase().includes(query),
        ),
      )
    }
  }, [searchQuery, files])

  const handleFileDelete = (fileId: string) => {
    setFiles(files.filter((file) => file.fileId !== fileId))
    setFilteredFiles(filteredFiles.filter((file) => file.fileId !== fileId))
  }

  const handleCreateLink = (fileId: string, link: LinkType) => {
    // This is handled in the parent component
    toast({
      title: "Link created",
      description: "Your file link has been created successfully.",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Files</h1>
          <p className="text-muted-foreground">Manage your uploaded files</p>
        </div>
        <UploadButton onUploadComplete={(file) => setFiles((prev) => [file, ...prev])} />
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search files..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <FileList files={filteredFiles} onDelete={handleFileDelete} onCreateLink={handleCreateLink} />
      )}
    </div>
  )
}
