"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Download, FileText, Folder, FolderOpen, Loader2, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { FileEntry, SortColumn, SortDirection } from "../types"
import { MouseEvent, memo } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface DirectoryTableProps {
  entries: FileEntry[]
  currentPath: string
  loading: boolean
  sortColumn: SortColumn
  sortDirection: SortDirection
  onSort: (column: SortColumn) => void
  onOpen: (entry: FileEntry) => void
  onDownload: (entry: FileEntry) => void
  onRename: (entry: FileEntry) => void
  onDelete: (entry: FileEntry) => void
  onNavigateUp: () => void
  menuOpenKey: string | null
  onMenuOpenKeyChange: (key: string | null) => void
  isTextLikeFile: (entry: FileEntry) => boolean
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
  onRename,
  onDelete,
  onNavigateUp,
  menuOpenKey,
  onMenuOpenKeyChange,
  isTextLikeFile,
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
            <TableRow className="cursor-pointer text-sm" onDoubleClick={onNavigateUp} onClick={onNavigateUp} style={{ height: "38px" }}>
              <TableCell colSpan={5} className="py-2">
                <div className="flex items-center gap-2">
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
            const OpenIcon = entry.isFile ? FileText : FolderOpen
            const entryKey = `${currentPath}${entry.name}`

            return (
              <TableRow
                key={`${currentPath}${entry.name}`}
                className="group cursor-pointer text-sm"
                onDoubleClick={() => onOpen(entry)}
                onClick={(event) => handleRowClick(event, entry)}
                style={{ height: "40px" }}
              >
                <TableCell className="py-2 font-medium">
                  <div className="flex items-center gap-2">
                    <Icon className={cn("h-4 w-4", entry.isFile ? "text-blue-500" : "text-amber-500")} />
                    <span className="truncate" title={entry.name}>
                      {entry.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="hidden py-2 text-xs text-muted-foreground sm:table-cell">
                  {entry.isFile ? formatBytes(entry.size) : "—"}
                </TableCell>
                <TableCell className="hidden py-2 text-xs text-muted-foreground md:table-cell">
                  {formatDate(entry.modifiedAt)}
                </TableCell>
                <TableCell className="hidden py-2 text-xs text-muted-foreground lg:table-cell">
                  {formatDate(entry.createdAt)}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu
                    open={menuOpenKey === entryKey}
                    onOpenChange={(open) => onMenuOpenKeyChange(open ? entryKey : null)}
                  >
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 data-[state=open]:bg-muted"
                        data-row-action="true"
                        onClick={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          onMenuOpenKeyChange(menuOpenKey === entryKey ? null : entryKey)
                        }}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36" data-row-action="true">
                      <DropdownMenuGroup>
                        <DropdownMenuItem
                          disabled={entry.isFile && !isTextLikeFile(entry)}
                          onClick={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                            onOpen(entry)
                          }}
                        >
                          <OpenIcon className="mr-2 h-4 w-4" />
                          Open
                        </DropdownMenuItem>
                        {entry.isFile && (
                          <DropdownMenuItem
                            onClick={(event) => {
                              event.preventDefault()
                              event.stopPropagation()
                              onDownload(entry)
                            }}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuItem
                          onClick={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                            onRename(entry)
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                            onDelete(entry)
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
