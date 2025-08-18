import type { DirectoryContents } from "../../../models/file-manager"

const ptUrl = process.env.NEXT_PUBLIC_PTERODACTYL_URL;

export class FileApiService {
  constructor(private serverId: string, private apiKey: string) { }

  // Track the current upload so it can be canceled by the UI
  private currentUpload?: { xhr?: XMLHttpRequest; fetchAbort?: AbortController }

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
    const response = await fetch(`${ptUrl}/api/client/servers/${this.serverId}/files/download?file=${encodeURIComponent(path)}`, {
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
    return new Promise(async (resolve, reject) => {
      try {
        const directory = currentPath || "/"

        const fetchAbort = new AbortController()
        this.currentUpload = { fetchAbort }

        const signedUrlRes = await fetch(
          `${ptUrl}/api/client/servers/${this.serverId}/files/upload?directory=${encodeURIComponent(directory)}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${this.apiKey}`,
            },
            signal: fetchAbort.signal,
          }
        )

        if (!signedUrlRes.ok) {
          let err: unknown
          try {
            err = await signedUrlRes.json()
          } catch (_) {
            err = new Error(`Failed to get signed upload URL (status ${signedUrlRes.status})`)
          }
          reject(err)
          return
        }

        const signedData = await signedUrlRes.json() as { attributes?: { url?: string } }
        const signedUrl = signedData?.attributes?.url
        if (!signedUrl) {
          reject(new Error("Signed upload URL not present in response"))
          return
        }

        // Step 2: Upload the file to the signed URL via multipart/form-data
        const formData = new FormData()
        formData.append("files", file)
        // Pterodactyl requires the directory field and it must match the one used to request the signed URL
        formData.append("directory", directory)

  const xhr = new XMLHttpRequest()
  this.currentUpload = { ...(this.currentUpload || {}), xhr }
        xhr.withCredentials = false // signed URL is public for the duration; do not include cookies

        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100)
            onProgress(percentComplete)
          }
        })

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            onProgress(100)
            resolve()
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText)
              reject(errorData)
            } catch {
              reject(new Error(`Upload failed with status ${xhr.status}`))
            }
          }
          this.currentUpload = undefined
        })

        xhr.addEventListener("error", () => {
          reject(new Error("Upload failed"))
          this.currentUpload = undefined
        })

        xhr.addEventListener("abort", () => {
          reject(new Error("Upload canceled"))
          this.currentUpload = undefined
        })

        xhr.open("POST", signedUrl)
        xhr.send(formData)
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") {
          reject(new Error("Upload canceled"))
        } else {
          reject(e as any)
        }
        this.currentUpload = undefined
      }
    })
  }

  // Public method to cancel any in-flight upload
  cancelUpload() {
    if (this.currentUpload?.fetchAbort) {
      this.currentUpload.fetchAbort.abort()
    }
    if (this.currentUpload?.xhr) {
      this.currentUpload.xhr.abort()
    }
    this.currentUpload = undefined
  }
}
