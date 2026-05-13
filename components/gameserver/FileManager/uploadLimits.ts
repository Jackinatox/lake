export const MAX_UPLOAD_FILES = 200;

export function limitFileList(files: FileList, limit = MAX_UPLOAD_FILES): FileList {
    const transfer = new DataTransfer();
    for (const file of Array.from(files).slice(0, limit)) {
        transfer.items.add(file);
    }
    return transfer.files;
}
