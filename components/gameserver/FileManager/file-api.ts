import type { DirectoryContents } from "../../../models/file-manager"

export class FileApiService {
  constructor(private serverId: string, private apiKey: string) { }

  async fetchFiles(path: string): Promise<DirectoryContents> {
    const response = await fetch(`/api/servers/${this.serverId}/files/list?directory=${encodeURIComponent(path)}`, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw errorData
    }

    return response.json()
  }

  async fetchFileContent(path: string): Promise<string> {
    const response = await fetch(`/api/servers/${this.serverId}/files/contents?file=${encodeURIComponent(path)}`, {
      headers: {
        Accept: "text/plain",
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw errorData
    }

    return response.text()
  }

  async saveFileContent(path: string, content: string): Promise<boolean> {
    const response = await fetch(`/api/servers/${this.serverId}/files/write?file=${encodeURIComponent(path)}`, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
      },
      body: content,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw errorData
    }

    return true
  }

  async downloadFile(path: string): Promise<void> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_PTERODACTYL_URL}/api/client/servers/${this.serverId}/files/download?file=${encodeURIComponent(path)}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${this.apiKey}`
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw errorData
    }

    const downloadUrl = await response.json()
    window.open(downloadUrl.attributes.url, "_blank")
  }

  async deleteFile(currentPath: string, fileName: string): Promise<void> {
    const response = await fetch(`/api/servers/${this.serverId}/files/delete`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        root: currentPath,
        files: [fileName],
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw errorData
    }
  }

  uploadFile(file: File, currentPath: string, onProgress: (progress: number) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      const formData = new FormData()
      formData.append("files", file)

      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100)
          onProgress(percentComplete)
        }
      })

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve()
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText)
            reject(errorData)
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`))
          }
        }
      })

      xhr.addEventListener("error", () => {
        reject(new Error("Upload failed"))
      })

      xhr.open("POST", `/api/servers/${this.serverId}/files/upload?directory=${encodeURIComponent(currentPath)}`)
      xhr.send(formData)
    })
  }
}
