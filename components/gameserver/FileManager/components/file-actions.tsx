"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Download, Edit, MoreHorizontal, Trash } from "lucide-react"
import type { FileActionsProps } from "../../../../models/file-manager"

export function FileActions({ file, currentPath, onEdit, onDownload, onDelete }: FileActionsProps) {
  return (
    <TooltipProvider>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {file.is_file && (
            <>
              {file.is_editable && (
                <DropdownMenuItem onClick={() => onEdit(file)}>
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onDownload(`${currentPath}${file.name}`)}>
                <Download className="mr-2 h-4 w-4" /> Download
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuItem onClick={() => onDelete(file.name)} className="text-red-600 focus:text-red-600">
            <Trash className="mr-2 h-4 w-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  )
}
