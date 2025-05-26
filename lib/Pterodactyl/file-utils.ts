export const formatFileSize = (bytes: number): string => {
  if (!bytes || bytes === 0) return "0 B"

  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(1024))

  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`
}

export const formatDate = (dateString: string): string => {
  if (!dateString) return "Unknown"

  try {
    const date = new Date(dateString)
    return date.toLocaleString()
  } catch {
    return "Invalid date"
  }
}

export const sortFiles = (files: any[], sortColumn: string, sortDirection: "asc" | "desc") => {
  return [...files].sort((a, b) => {
    // Ensure both files have valid names
    if (!a || !b || !a.name || !b.name) {
      console.warn("Invalid file objects in sort:", { a, b })
      return 0
    }

    // Always sort directories first
    if (a.is_file !== b.is_file) {
      return a.is_file ? 1 : -1
    }

    // Then sort by the selected column
    if (sortColumn === "name") {
      return sortDirection === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    } else if (sortColumn === "size") {
      const sizeA = a.size || 0
      const sizeB = b.size || 0
      return sortDirection === "asc" ? sizeA - sizeB : sizeB - sizeA
    } else if (sortColumn === "modified") {
      const dateA = new Date(a.modified_at || 0).getTime()
      const dateB = new Date(b.modified_at || 0).getTime()
      return sortDirection === "asc" ? dateA - dateB : dateB - dateA
    }
    return 0
  })
}
