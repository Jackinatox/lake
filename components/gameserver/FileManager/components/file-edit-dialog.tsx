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
import { Textarea } from "@/components/ui/textarea"
import type { FileEditDialogProps } from "../types/file-manager"

export function FileEditDialog({ isOpen, file, content, onContentChange, onSave, onClose }: FileEditDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">Editing {file?.name}</DialogTitle>
          <DialogDescription className="text-base">
            Make changes to the file content and save when done.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 my-4">
          <Textarea
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            className="h-full font-mono text-sm resize-none"
            placeholder="File content will appear here..."
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} size="lg">
            Cancel
          </Button>
          <Button onClick={onSave} size="lg">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
