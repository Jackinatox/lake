"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, RefreshCw, Upload } from "lucide-react"

import { BreadcrumbNavigation } from "./components/breadcrumb-navigation"
import { FileList } from "./components/file-list"
import { FileEditDialog } from "./components/file-edit-dialog"
import { FileUploadDialog } from "./components/file-upload-dialog"
import { FileApiService } from "./file-api"
import type { FileManagerProps, FileEntry } from "../../../models/file-manager"

export function FileManager({ server, apiKey }: FileManagerProps) {
  const router = useRouter()
  const [currentPath, setCurrentPath] = useState("/")
  const [files, setFiles] = useState<FileEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortColumn, setSortColumn] = useState<string>("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [selectedFile, setSelectedFile] = useState<FileEntry | null>(null)
  const [fileContent, setFileContent] = useState<string>("")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadingFile, setUploadingFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const apiService = new FileApiService(server.identifier, apiKey)

  const handleApiError = (error: any) => {
    if (error.redirect) {
      router.push(error.redirect)
      return
    }
    setError(error.error || "An error occurred")
  }

  const fetchFiles = async (path: string = currentPath) => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiService.fetchFiles(path)

      if (!data || !Array.isArray(data.data)) {
        setError("Invalid response from server")
        return
      }

      const validFiles = data.data.filter((file) => {
        if (!file || typeof file.name !== "string") {
          console.warn("Invalid file entry:", file)
          return false
        }
        return true
      })

      setFiles(validFiles)
    } catch (err) {
      console.error("Error fetching files:", err)
      handleApiError(err)
    } finally {
      setLoading(false)
    }
  }

  const handleFileClick = async (file: FileEntry) => {
    if (file.is_file) {
      setSelectedFile(file)
      if (file.is_editable) {
        try {
          const content = await apiService.fetchFileContent(`${currentPath}${file.name}`)
          setFileContent(content)
          setIsEditDialogOpen(true)
        } catch (err) {
          handleApiError(err)
        }
      } else {
        // For non-editable files, trigger download
        try {
          await apiService.downloadFile(`${currentPath}${file.name}`)
        } catch (err) {
          handleApiError(err)
        }
      }
    } else {
      // Navigate to directory
      const newPath = `${currentPath}${file.name}/`
      setCurrentPath(newPath)
      fetchFiles(newPath)
    }
  }

  const handleSaveFile = async () => {
    if (!selectedFile) return

    try {
      await apiService.saveFileContent(`${currentPath}${selectedFile.name}`, fileContent)
      setIsEditDialogOpen(false)
      fetchFiles()
    } catch (err) {
      handleApiError(err)
    }
  }

  const handleNavigateUp = () => {
    if (currentPath === "/") return

    const pathParts = currentPath.split("/").filter(Boolean)
    pathParts.pop()
    const newPath = pathParts.length ? `/${pathParts.join("/")}/` : "/"
    setCurrentPath(newPath)
    fetchFiles(newPath)
  }

  const handleNavigate = (path: string) => {
    setCurrentPath(path)
    fetchFiles(path)
  }

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const handleDownload = async (path: string) => {
    try {
      await apiService.downloadFile(path)
    } catch (err) {
      handleApiError(err)
    }
  }

  const handleDelete = async (fileName: string) => {
    try {
      await apiService.deleteFile(currentPath, fileName)
      fetchFiles()
    } catch (err) {
      handleApiError(err)
    }
  }

  const handleUpload = async (file: File) => {
    setIsUploading(true)
    setUploadProgress(0)

    try {
      await apiService.uploadFile(file, currentPath, setUploadProgress)
      fetchFiles()
      setIsUploadDialogOpen(false)
    } catch (err) {
      handleApiError(err)
    } finally {
      setIsUploading(false)
    }
  }

  const handleCancelUpload = () => {
    apiService.cancelUpload()
    setIsUploading(false)
    setUploadProgress(0)
    setUploadingFile(null)
    setIsUploadDialogOpen(false)
  }

  useEffect(() => {
    fetchFiles()
  }, [])

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6" />
            <span className="text-xl">File Manager</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="default" onClick={() => fetchFiles()}>
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
            <Button variant="outline" size="default" onClick={() => setIsUploadDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" /> Upload
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription className="text-base">{error}</AlertDescription>
          </Alert>
        )}

        <BreadcrumbNavigation currentPath={currentPath} onNavigate={handleNavigate} />

        <FileList
          files={files}
          currentPath={currentPath}
          loading={loading}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onFileClick={handleFileClick}
          onSort={handleSort}
          onNavigateUp={handleNavigateUp}
          onDownload={handleDownload}
          onDelete={handleDelete}
        />
      </CardContent>

      <FileEditDialog
        isOpen={isEditDialogOpen}
        file={selectedFile}
        content={fileContent}
        onContentChange={setFileContent}
        onSave={handleSaveFile}
        onClose={() => setIsEditDialogOpen(false)}
      />

      <FileUploadDialog
        isOpen={isUploadDialogOpen}
        currentPath={currentPath}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        uploadingFile={uploadingFile}
        onFileSelect={setUploadingFile}
        onUpload={handleUpload}
  onCancel={handleCancelUpload}
        onClose={() => setIsUploadDialogOpen(false)}
      />
    </Card>
  )
}
