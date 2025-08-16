import { GameServer } from "./gameServerModel"

export interface FileManagerProps {
  server: GameServer,
  apiKey: string
}

export interface FileEntry {
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

export interface DirectoryContents {
  data: FileEntry[]
}

export interface FileListProps {
  files: FileEntry[]
  currentPath: string
  loading: boolean
  sortColumn: string
  sortDirection: "asc" | "desc"
  onFileClick: (file: FileEntry) => void
  onSort: (column: string) => void
  onNavigateUp: () => void
  onDownload: (path: string) => void
  onDelete: (path: string) => void
}

export interface BreadcrumbNavigationProps {
  currentPath: string
  onNavigate: (path: string) => void
}

export interface FileActionsProps {
  file: FileEntry
  currentPath: string
  onEdit: (file: FileEntry) => void
  onDownload: (path: string) => void
  onDelete: (path: string) => void
}

export interface FileEditDialogProps {
  isOpen: boolean
  file: FileEntry | null
  content: string
  onContentChange: (content: string) => void
  onSave: () => void
  onClose: () => void
}

export interface FileUploadDialogProps {
  isOpen: boolean
  currentPath: string
  isUploading: boolean
  uploadProgress: number
  uploadingFile: File | null
  onFileSelect: (file: File) => void
  onUpload: (file: File) => void
  onClose: () => void
}
