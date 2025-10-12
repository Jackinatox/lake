export type FileEntry = {
  name: string;
  mode: string;
  modeBits: string;
  size: number;
  isFile: boolean;
  isSymlink: boolean;
  mimetype: string;
  createdAt: string;
  modifiedAt: string;
};

export type SortColumn = "name" | "size" | "modifiedAt" | "createdAt";
export type SortDirection = "asc" | "desc";

export type DirectoryState = {
  path: string;
  entries: FileEntry[];
  loading: boolean;
  error: string | null;
};

export type FileEditorState = {
  path: string | null;
  content: string;
  loading: boolean;
  saving: boolean;
  isOpen: boolean;
  isBinary: boolean;
};
