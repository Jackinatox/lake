export type BackupStatus = 'creating' | 'completed' | 'failed';

export interface Backup {
    uuid: string;
    name: string;
    ignoredFiles: string[];
    sha256Hash: string | null;
    bytes: number;
    createdAt: string;
    completedAt: string | null;
    status: BackupStatus;
    isSuccessful: boolean | null;
    isLocked: boolean;
}
