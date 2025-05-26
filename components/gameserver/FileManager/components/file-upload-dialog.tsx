"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import type { FileUploadDialogProps } from "../types/file-manager"

export function FileUploadDialog({
  isOpen,
  currentPath,
  isUploading,
  uploadProgress,
  uploadingFile,
  onFileSelect,
  onUpload,
  onClose,
}: FileUploadDialogProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!isUploading) onClose()
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Upload File</DialogTitle>
          <DialogDescription className="text-base">
            Select a file to upload to the current directory: {currentPath}
          </DialogDescription>
        </DialogHeader>

        <div className="my-6">
          <Input
            type="file"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                onFileSelect(e.target.files[0])
              }
            }}
            disabled={isUploading}
            className="text-base"
          />
        </div>

        {isUploading && (
          <div className="my-6">
            <p className="mb-3 text-base font-medium">Uploading {uploadingFile?.name}...</p>
            <Progress value={uploadProgress} className="h-3" />
            <p className="mt-2 text-sm text-right font-medium">{uploadProgress}%</p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isUploading} size="lg">
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (uploadingFile) {
                onUpload(uploadingFile)
              }
            }}
            disabled={!uploadingFile || isUploading}
            size="lg"
          >
            {isUploading ? "Uploading..." : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
