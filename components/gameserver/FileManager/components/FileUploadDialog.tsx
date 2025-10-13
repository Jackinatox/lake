"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { UploadCloud } from "lucide-react"
import { ChangeEvent, ReactNode, memo, useMemo } from "react"

interface FileUploadDialogProps {
  children?: ReactNode
  open: boolean
  directory: string
  progress: number
  isUploading: boolean
  files: FileList | null
  onOpenChange: (open: boolean) => void
  onFileSelect: (files: FileList | null) => void
  onUpload: () => void
}

function formatDirectory(directory: string) {
  return directory || "/"
}

const FileUploadDialogComponent = ({
  children,
  open,
  directory,
  progress,
  isUploading,
  files,
  onOpenChange,
  onFileSelect,
  onUpload,
}: FileUploadDialogProps) => {
  const progressLabel = useMemo(() => {
    if (!isUploading) return null
    return `${progress}%`
  }, [isUploading, progress])

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    onFileSelect(event.target.files)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload files</DialogTitle>
          <DialogDescription>
            Files will be uploaded to <span className="font-mono">{formatDirectory(directory)}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-dashed p-6 text-center">
            <UploadCloud className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">
              Select from your device.
            </p>
            <div className="mt-4 flex justify-center">
              <Label
                htmlFor="file-upload-input"
                className="cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
              >
                Choose files
              </Label>
              <Input
                id="file-upload-input"
                type="file"
                multiple
                className="sr-only"
                onChange={handleFileChange}
                disabled={isUploading}
              />
            </div>
          </div>

          {files && files.length > 0 && (
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              <p className="font-medium">Selected files:</p>
              <ul className="mt-2 space-y-1 font-mono text-xs">
                {Array.from(files).map((file) => (
                  <li key={file.name}>{file.name}</li>
                ))}
              </ul>
            </div>
          )}

          {isUploading && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-muted-foreground">{progressLabel}</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>
            Cancel
          </Button>
          <Button type="button" onClick={onUpload} disabled={isUploading || !files || files.length === 0}>
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export const FileUploadDialog = memo(FileUploadDialogComponent)
