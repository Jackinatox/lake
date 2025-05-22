"use client"

import React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TooltipProvider } from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import type { ClientServer } from "pterodactyl.js"
import {
  ArrowUpDown,
  ChevronRight,
  Download,
  Edit,
  File,
  Folder,
  MoreHorizontal,
  RefreshCw,
  Trash,
  Upload,
} from "lucide-react"
import { useEffect, useState } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { FileText } from "lucide-react" // Import FileText here

interface FileManagerProps {
  server: ClientServer
  ptApiKey: string
}

interface FileEntry {
  name: string
  mode: string
  size: number
  is_file: boolean
  is_symlink: boolean
  is_editable: boolean
  mimetype: string
  created_at: string
  modified_at: string
}

interface DirectoryContents {
  data: FileEntry[]
}

export function FileManager({ server, ptApiKey }: FileManagerProps) {
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

  const baseUrl = process.env.NEXT_PUBLIC_PTERODACTYL_URL

  const fetchFiles = async (path: string = currentPath) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `${baseUrl}/api/client/servers/${server.identifier}/files/list?directory=${encodeURIComponent(path)}`,
        {
          headers: {
            Authorization: `Bearer ${ptApiKey}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        },
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch files: ${response.statusText}`)
      }

      const data: DirectoryContents = await response.json()
      setFiles(data.data)
    } catch (err) {
      console.error("Error fetching files:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch files")
    } finally {
      setLoading(false)
    }
  }

  const fetchFileContent = async (path: string) => {
    try {
      const response = await fetch(
        `${baseUrl}/api/client/servers/${server.identifier}/files/contents?file=${encodeURIComponent(path)}`,
        {
          headers: {
            Authorization: `Bearer ${ptApiKey}`,
            Accept: "application/json",
          },
        },
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch file content: ${response.statusText}`)
      }

      const content = await response.text()
      return content
    } catch (err) {
      console.error("Error fetching file content:", err)
      throw err
    }
  }

  const saveFileContent = async (path: string, content: string) => {
    try {
      const response = await fetch(
        `${baseUrl}/api/client/servers/${server.identifier}/files/write?file=${encodeURIComponent(path)}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${ptApiKey}`,
            "Content-Type": "text/plain",
          },
          body: content,
        },
      )

      if (!response.ok) {
        throw new Error(`Failed to save file: ${response.statusText}`)
      }

      return true
    } catch (err) {
      console.error("Error saving file:", err)
      throw err
    }
  }

  const downloadFile = async (path: string) => {
    try {
      const response = await fetch(
        `${baseUrl}/api/client/servers/${server.identifier}/files/download?file=${encodeURIComponent(path)}`,
        {
          headers: {
            Authorization: `Bearer ${ptApiKey}`,
          },
        },
      )

      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`)
      }

      const downloadUrl = await response.json()
      window.open(downloadUrl.attributes.url, "_blank")
    } catch (err) {
      console.error("Error downloading file:", err)
      setError(err instanceof Error ? err.message : "Failed to download file")
    }
  }

  const deleteFile = async (path: string) => {
    try {
      const response = await fetch(`${baseUrl}/api/client/servers/${server.identifier}/files/delete`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ptApiKey}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          root: currentPath,
          files: [path],
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to delete file: ${response.statusText}`)
      }

      fetchFiles()
    } catch (err) {
      console.error("Error deleting file:", err)
      setError(err instanceof Error ? err.message : "Failed to delete file")
    }
  }

  const uploadFile = async (file: File) => {
    setIsUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append("files", file)

      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100)
          setUploadProgress(percentComplete)
        }
      })

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          fetchFiles()
          setIsUploadDialogOpen(false)
          setIsUploading(false)
        } else {
          throw new Error(`Upload failed with status ${xhr.status}`)
        }
      })

      xhr.addEventListener("error", () => {
        throw new Error("Upload failed")
      })

      xhr.open(
        "POST",
        `${baseUrl}/api/client/servers/${server.identifier}/files/upload?directory=${encodeURIComponent(currentPath)}`,
      )
      xhr.setRequestHeader("Authorization", `Bearer ${ptApiKey}`)
      xhr.send(formData)
    } catch (err) {
      console.error("Error uploading file:", err)
      setError(err instanceof Error ? err.message : "Failed to upload file")
      setIsUploading(false)
    }
  }

  const handleFileClick = async (file: FileEntry) => {
    if (file.is_file) {
      setSelectedFile(file)
      if (file.is_editable) {
        try {
          const content = await fetchFileContent(`${currentPath}${file.name}`)
          setFileContent(content)
          setIsEditDialogOpen(true)
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to open file")
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
      await saveFileContent(`${currentPath}${selectedFile.name}`, fileContent)
      setIsEditDialogOpen(false)
      fetchFiles()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save file")
    }
  }

  const navigateUp = () => {
    if (currentPath === "/") return

    const pathParts = currentPath.split("/").filter(Boolean)
    pathParts.pop()
    const newPath = pathParts.length ? `/${pathParts.join("/")}/` : "/"
    setCurrentPath(newPath)
    fetchFiles(newPath)
  }

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const sortedFiles = [...files].sort((a, b) => {
    // Always sort directories first
    if (a.is_file !== b.is_file) {
      return a.is_file ? 1 : -1
    }

    // Then sort by the selected column
    if (sortColumn === "name") {
      return sortDirection === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    } else if (sortColumn === "size") {
      return sortDirection === "asc" ? a.size - b.size : b.size - a.size
    } else if (sortColumn === "modified") {
      return sortDirection === "asc"
        ? new Date(a.modified_at).getTime() - new Date(b.modified_at).getTime()
        : new Date(b.modified_at).getTime() - new Date(a.modified_at).getTime()
    }
    return 0
  })

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B"

    const sizes = ["B", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(1024))

    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const getBreadcrumbItems = () => {
    const parts = currentPath.split("/").filter(Boolean)

    return (
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink
            onClick={() => {
              setCurrentPath("/")
              fetchFiles("/")
            }}
          >
            Root
          </BreadcrumbLink>
        </BreadcrumbItem>

        {parts.map((part, index) => {
          const path = `/${parts.slice(0, index + 1).join("/")}/`
          return (
            <React.Fragment key={path}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink
                  onClick={() => {
                    setCurrentPath(path)
                    fetchFiles(path)
                  }}
                >
                  {part}
                </BreadcrumbLink>
              </BreadcrumbItem>
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    )
  }

  useEffect(() => {
    fetchFiles()
  }, [])

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" /> File Manager
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => fetchFiles()}>
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsUploadDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-1" /> Upload
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="mb-4">
          <Breadcrumb>{getBreadcrumbItems()}</Breadcrumb>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">
                  <Button variant="ghost" size="sm" onClick={() => handleSort("name")} className="flex items-center">
                    Name
                    {sortColumn === "name" && (
                      <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                    )}
                  </Button>
                </TableHead>
                <TableHead className="w-[20%]">
                  <Button variant="ghost" size="sm" onClick={() => handleSort("size")} className="flex items-center">
                    Size
                    {sortColumn === "size" && (
                      <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                    )}
                  </Button>
                </TableHead>
                <TableHead className="w-[30%]">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("modified")}
                    className="flex items-center"
                  >
                    Last Modified
                    {sortColumn === "modified" && (
                      <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                    )}
                  </Button>
                </TableHead>
                <TableHead className="w-[10%] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentPath !== "/" && (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Button variant="ghost" size="sm" onClick={navigateUp} className="flex items-center">
                      <Folder className="mr-2 h-4 w-4" /> ..
                    </Button>
                  </TableCell>
                </TableRow>
              )}

              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    Loading files...
                  </TableCell>
                </TableRow>
              ) : sortedFiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    No files found in this directory
                  </TableCell>
                </TableRow>
              ) : (
                sortedFiles.map((file) => (
                  <TableRow key={file.name}>
                    <TableCell>
                      <div className="flex items-center">
                        {file.is_file ? <File className="mr-2 h-4 w-4" /> : <Folder className="mr-2 h-4 w-4" />}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFileClick(file)}
                          className="text-left font-normal"
                        >
                          {file.name}
                          {!file.is_file && <ChevronRight className="ml-1 h-4 w-4" />}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{file.is_file ? formatFileSize(file.size) : "--"}</TableCell>
                    <TableCell>{formatDate(file.modified_at)}</TableCell>
                    <TableCell className="text-right">
                      <TooltipProvider>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {file.is_file && (
                              <>
                                {file.is_editable && (
                                  <DropdownMenuItem onClick={() => handleFileClick(file)}>
                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => downloadFile(`${currentPath}${file.name}`)}>
                                  <Download className="mr-2 h-4 w-4" /> Download
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuItem
                              onClick={() => deleteFile(file.name)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* File Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Editing {selectedFile?.name}</DialogTitle>
            <DialogDescription>Make changes to the file content and save when done.</DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 my-4">
            <Textarea
              value={fileContent}
              onChange={(e) => setFileContent(e.target.value)}
              className="h-full font-mono text-sm"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveFile}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* File Upload Dialog */}
      <Dialog
        open={isUploadDialogOpen}
        onOpenChange={(open) => {
          if (!isUploading) setIsUploadDialogOpen(open)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
            <DialogDescription>Select a file to upload to the current directory: {currentPath}</DialogDescription>
          </DialogHeader>

          <div className="my-4">
            <Input
              type="file"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setUploadingFile(e.target.files[0])
                }
              }}
              disabled={isUploading}
            />
          </div>

          {isUploading && (
            <div className="my-4">
              <p className="mb-2 text-sm">Uploading {uploadingFile?.name}...</p>
              <Progress value={uploadProgress} className="h-2" />
              <p className="mt-1 text-xs text-right">{uploadProgress}%</p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)} disabled={isUploading}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (uploadingFile) {
                  uploadFile(uploadingFile)
                }
              }}
              disabled={!uploadingFile || isUploading}
            >
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
