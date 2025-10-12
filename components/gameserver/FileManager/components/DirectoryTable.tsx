"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { FileText, Folder, FolderOpen, Loader2, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { FileEntry, SortColumn, SortDirection } from "../types"
import { MouseEvent, memo } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface DirectoryTableProps {
  entries: FileEntry[]
  currentPath: string
  loading: boolean
  sortColumn: SortColumn
  sortDirection: SortDirection
  onSort: (column: SortColumn) => void
  onOpen: (entry: FileEntry) => void
  onDownload: (entry: FileEntry) => void
  onNavigateUp: () => void
}

const sortLabel: Record<SortColumn, string> = {
  name: "Name",
  size: "Size",
  modifiedAt: "Modified",
  createdAt: "Created",
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "—"
  const units = ["B", "KB", "MB", "GB", "TB"]
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const size = bytes / Math.pow(1024, exponent)
  return `${size.toFixed(size >= 10 || size === Math.floor(size) ? 0 : 1)} ${units[exponent]}`
}

function formatDate(value: string) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function SortableHeader({ column, active, direction, onSort }: { column: SortColumn; active: boolean; direction: SortDirection; onSort: (column: SortColumn) => void }) {
  return (
    <button
      type="button"
      className={cn("inline-flex items-center gap-2 font-medium", active ? "text-foreground" : "text-muted-foreground")}
      onClick={() => onSort(column)}
    >
      {sortLabel[column]}
      {active && <span className="text-xs">{direction === "asc" ? "▲" : "▼"}</span>}
    </button>
  )
}

const DirectoryTableComponent = ({
  entries,
  currentPath,
  loading,
  sortColumn,
  sortDirection,
  onSort,
  onOpen,
  onDownload,
  onNavigateUp,
}: DirectoryTableProps) => {
  const hasParent = currentPath !== "/"

  const handleRowClick = (event: MouseEvent<HTMLTableRowElement>, entry: FileEntry) => {
    const target = event.target as HTMLElement | null
    if (target?.closest('[data-row-action="true"]')) {
      return
    }
    onOpen(entry)
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-full sm:w-1/2">
              <SortableHeader column="name" active={sortColumn === "name"} direction={sortDirection} onSort={onSort} />
            </TableHead>
            <TableHead className="hidden sm:table-cell sm:w-32">
              <SortableHeader column="size" active={sortColumn === "size"} direction={sortDirection} onSort={onSort} />
            </TableHead>
            <TableHead className="hidden md:table-cell md:w-48">
              <SortableHeader column="modifiedAt" active={sortColumn === "modifiedAt"} direction={sortDirection} onSort={onSort} />
            </TableHead>
            <TableHead className="hidden lg:table-cell lg:w-48">
              <SortableHeader column="createdAt" active={sortColumn === "createdAt"} direction={sortDirection} onSort={onSort} />
            </TableHead>
            <TableHead className="w-16" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && (
            <TableRow>
              <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading directory…
                </div>
              </TableCell>
            </TableRow>
          )}

          {!loading && hasParent && (
            <TableRow className="cursor-pointer" onDoubleClick={onNavigateUp} onClick={onNavigateUp}>
              <TableCell colSpan={5}>
                <div className="flex items-center gap-3">
                  <FolderOpen className="h-4 w-4 text-muted-foreground" />
                  ..
                </div>
              </TableCell>
            </TableRow>
          )}

          {!loading && entries.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                This directory is empty.
              </TableCell>
            </TableRow>
          )}

          {!loading && entries.map((entry) => {
            const Icon = entry.isFile ? FileText : Folder
            return (
              <TableRow
                key={`${currentPath}${entry.name}`}
                className="cursor-pointer"
                onDoubleClick={() => onOpen(entry)}
                onClick={(event) => handleRowClick(event, entry)}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <Icon className={cn("h-4 w-4", entry.isFile ? "text-blue-500" : "text-amber-500")} />
                    <span className="truncate" title={entry.name}>
                      {entry.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                  {entry.isFile ? formatBytes(entry.size) : "—"}
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                  {formatDate(entry.modifiedAt)}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                  {formatDate(entry.createdAt)}
                </TableCell>
                <TableCell className="text-right">
                  {entry.isFile && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" data-row-action="true">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                            onOpen(entry)
                          }}
                        >
                          Open
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                            onDownload(entry)
                          }}
                        >
                          Download
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

export const DirectoryTable = memo(DirectoryTableComponent)
