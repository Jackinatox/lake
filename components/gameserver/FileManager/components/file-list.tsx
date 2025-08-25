"use client"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowUpDown, ChevronRight, Edit, File, Folder } from "lucide-react"
import { FileActions } from "./file-actions"
import { formatDate, formatFileSize, sortFiles } from "../../../../lib/Pterodactyl/file-utils"
import { FileListProps } from "@/models/file-manager"


export function FileList({
  files,
  currentPath,
  loading,
  sortColumn,
  sortDirection,
  onFileClick,
  onSort,
  onNavigateUp,
  onDownload,
  onDelete,
}: FileListProps) {
  const sortedFiles = sortFiles(files, sortColumn, sortDirection)

  const handleEdit = (file: any) => {
    onFileClick(file)
  }

  return (
    <div className="rounded-md border">
      <Table className="table-fixed sm:table-auto p-2">
        <TableHeader>
          <TableRow className="h-12">
            <TableHead className="py-2 sm:py-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSort("name")}
                className="flex items-center h-8 text-sm sm:text-base font-semibold"
              >
                Name
                {sortColumn === "name" && (
                  <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                )}
              </Button>
            </TableHead>
            <TableHead className="py-2 sm:py-3 hidden sm:table-cell">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSort("size")}
                className="flex items-center h-8 text-sm sm:text-base font-semibold"
              >
                Size
                {sortColumn === "size" && (
                  <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                )}
              </Button>
            </TableHead>
            <TableHead className="py-2 sm:py-3 hidden sm:table-cell">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSort("modified")}
                className="flex items-center h-8 text-sm sm:text-base font-semibold"
              >
                Last Modified
                {sortColumn === "modified" && (
                  <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                )}
              </Button>
            </TableHead>
            <TableHead className="text-right py-2 sm:py-3 text-sm sm:text-base font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentPath !== "/" && (
            <TableRow className="h-12 hover:bg-muted/50 cursor-pointer group">
              <TableCell colSpan={3} className="py-2 px-2 sm:px-4" onClick={onNavigateUp}>
                <div className="flex items-center w-full">
                  <Folder className="mr-3 h-6 w-6 text-muted-foreground" />
                  <span className="text-sm sm:text-base font-medium">.. (Parent Directory)</span>
                </div>
              </TableCell>
              <TableCell className="py-2 px-2 sm:px-4"></TableCell>
            </TableRow>
          )}

          {loading ? (
            <TableRow className="h-12">
              <TableCell colSpan={4} className="text-center py-8 text-sm sm:text-base text-muted-foreground">
                Loading files...
              </TableCell>
            </TableRow>
          ) : sortedFiles.length === 0 ? (
            <TableRow className="h-12">
              <TableCell colSpan={4} className="text-center py-8 text-sm sm:text-base text-muted-foreground">
                No files found in this directory
              </TableCell>
            </TableRow>
          ) : (
            sortedFiles.map((file, index) => (
              <TableRow key={`${file.name}-${index}`} className="h-12 hover:bg-muted/50 cursor-pointer group">
                <TableCell className="py-2 px-2 sm:px-4" onClick={() => onFileClick(file)}>
                  <div className="flex items-center w-full">
                    {file.is_file ? (
                      <File className="mr-3 h-6 w-6 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <Folder className="mr-3 h-6 w-6 text-blue-500 flex-shrink-0" />
                    )}
                    <span className="text-sm sm:text-base truncate flex-1 min-w-0 font-medium">{file.name}</span>
                    {!file.is_file && (
                      <ChevronRight className="ml-2 h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    )}
                    {file.is_file && file.is_editable && (
                      <Edit className="ml-2 h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-2 px-2 sm:px-4 text-sm sm:text-base text-muted-foreground hidden sm:table-cell" onClick={() => onFileClick(file)}>
                  {file.is_file ? formatFileSize(file.size) : "--"}
                </TableCell>
                <TableCell className="py-2 px-2 sm:px-4 text-sm sm:text-base text-muted-foreground hidden sm:table-cell" onClick={() => onFileClick(file)}>
                  {formatDate(file.modified_at)}
                </TableCell>
                <TableCell className="py-2 px-2 sm:px-4 text-right">
                  <FileActions
                    file={file}
                    currentPath={currentPath}
                    onEdit={handleEdit}
                    onDownload={onDownload}
                    onDelete={onDelete}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
