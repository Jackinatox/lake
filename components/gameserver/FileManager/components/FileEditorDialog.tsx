"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { memo } from "react"

interface FileEditorDialogProps {
  open: boolean
  fileName: string | null
  filePath: string | null
  isBinary: boolean
  loading: boolean
  saving: boolean
  content: string
  onClose: () => void
  onChange: (value: string) => void
  onSave: () => void
}

const FileEditorDialogComponent = ({
  open,
  fileName,
  filePath,
  isBinary,
  loading,
  saving,
  content,
  onClose,
  onChange,
  onSave,
}: FileEditorDialogProps) => {
  const title = fileName ?? "File"

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-h-[85vh] w-full max-w-3xl overflow-hidden p-0 sm:p-0">
        <DialogHeader className="space-y-2 border-b px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="truncate text-lg font-semibold">
              {title}
            </DialogTitle>
            {filePath && (
              <Badge variant="outline" className="font-mono text-xs">
                {filePath}
              </Badge>
            )}
          </div>
          <DialogDescription>
            {isBinary
              ? "Binary files cannot be edited in the browser."
              : "Make your changes below and press save to update the file."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 px-6 py-5">
          {loading ? (
            <div className="flex h-[280px] items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading file contents…
            </div>
          ) : isBinary ? (
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>This file appears to be binary or too large to display in the browser.</p>
              <p>Please download it instead.</p>
            </div>
          ) : (
            <Textarea
              value={content}
              onChange={(event) => onChange(event.target.value)}
              className="min-h-[320px] font-mono text-sm"
              spellCheck={false}
            />
          )}
        </div>
        <DialogFooter className="border-t bg-muted/30 px-6 py-4">
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-between sm:gap-4">
            <Button variant="ghost" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={onSave} disabled={saving || loading || isBinary}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export const FileEditorDialog = memo(FileEditorDialogComponent)
