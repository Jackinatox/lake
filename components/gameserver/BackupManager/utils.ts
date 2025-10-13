export function formatBytes(bytes: number | null | undefined): string {
    if (bytes === null || bytes === undefined) return "Unknown"
    if (bytes === 0) return "0 B"
    const units = ["B", "KB", "MB", "GB", "TB", "PB"]
    let value = bytes
    let unitIndex = 0
    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024
        unitIndex += 1
    }
    const decimals = value >= 10 || unitIndex === 0 ? 0 : 1
    return `${value.toFixed(decimals)} ${units[unitIndex]}`
}

export function formatDateTime(value: string | null): string {
    if (!value) return "–"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleString()
}

export function deriveStatusLabel(status: "creating" | "completed" | "failed"): string {
    switch (status) {
        case "creating":
            return "Creating"
        case "failed":
            return "Failed"
        default:
            return "Completed"
    }
}
