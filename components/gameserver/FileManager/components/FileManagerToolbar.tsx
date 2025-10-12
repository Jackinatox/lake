"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RefreshCcw, Search, UploadCloud } from "lucide-react"
import { memo, useState } from "react"

interface FileManagerToolbarProps {
  onRefresh: () => void
  onUploadClick: () => void
  onFilterChange: (value: string) => void
  disabled?: boolean
}

const FileManagerToolbarComponent = ({ onRefresh, onUploadClick, onFilterChange, disabled }: FileManagerToolbarProps) => {
  const [filter, setFilter] = useState("")

  const handleFilterChange = (value: string) => {
    setFilter(value)
    onFilterChange(value)
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:w-72">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filter}
          onChange={(event) => handleFilterChange(event.target.value)}
          placeholder="Filter files"
          className="pl-9"
          disabled={disabled}
        />
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onRefresh} disabled={disabled}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
        <Button onClick={onUploadClick} disabled={disabled}>
          <UploadCloud className="mr-2 h-4 w-4" />
          Upload
        </Button>
      </div>
    </div>
  )
}

export const FileManagerToolbar = memo(FileManagerToolbarComponent)
