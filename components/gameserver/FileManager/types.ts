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

export type SortColumn = 'name' | 'size' | 'modifiedAt' | 'createdAt';
export type SortDirection = 'asc' | 'desc';
