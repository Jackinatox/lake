import { auth } from "@/auth"
import { type NextRequest, NextResponse } from "next/server"

const baseUrl = process.env.NEXT_PUBLIC_PTERODACTYL_URL

interface PterodactylFileObject {
  object: string
  attributes: {
    name: string
    mode: string
    mode_bits: string
    size: number
    is_file: boolean
    is_symlink: boolean
    mimetype: string
    created_at: string
    modified_at: string
  }
}

interface PterodactylResponse {
  object: string
  data: PterodactylFileObject[]
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ server_id: string }> }) {
  try {
    const serverId = (await params).server_id
    const { searchParams } = new URL(request.url)
    const directory = searchParams.get("directory") || "/"

    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const ptApiKey = session?.user.ptKey;
    if (!ptApiKey) {
      return NextResponse.json({ error: "No Pterodactyl API key found" }, { status: 401 })
    }

    const response = await fetch(
      `${baseUrl}/api/client/servers/${serverId}/files/list?directory=${encodeURIComponent(directory)}`,
      {
        headers: {
          Authorization: `Bearer ${ptApiKey}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      },
    )

    if (response.status === 403 || response.status === 404) {
      // User doesn't have access to this server
      return NextResponse.json({ error: "Access denied", redirect: "/gameserver" }, { status: 403 })
    }

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ error: `Pterodactyl API error: ${errorText}` }, { status: response.status })
    }

    const pterodactylData: PterodactylResponse = await response.json()

    // Transform the Pterodactyl response to match our expected format
    const transformedData = {
      data: pterodactylData.data.map((fileObj) => ({
        name: fileObj.attributes.name,
        mode: fileObj.attributes.mode,
        size: fileObj.attributes.size,
        is_file: fileObj.attributes.is_file,
        is_symlink: fileObj.attributes.is_symlink,
        is_editable: fileObj.attributes.is_file && isEditableFile(fileObj.attributes.mimetype, fileObj.attributes.name),
        mimetype: fileObj.attributes.mimetype,
        created_at: fileObj.attributes.created_at,
        modified_at: fileObj.attributes.modified_at,
      })),
    }

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error("Error in files/list API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Helper function to determine if a file is editable
function isEditableFile(mimetype: string, filename: string): boolean {
  const editableMimeTypes = ["text/", "application/json", "application/xml", "application/yaml", "application/x-yaml"]

  const editableExtensions = [
    ".txt",
    ".log",
    ".conf",
    ".config",
    ".cfg",
    ".ini",
    ".properties",
    ".json",
    ".xml",
    ".yaml",
    ".yml",
    ".toml",
    ".js",
    ".ts",
    ".jsx",
    ".tsx",
    ".css",
    ".scss",
    ".sass",
    ".less",
    ".html",
    ".htm",
    ".md",
    ".markdown",
    ".sh",
    ".bash",
    ".bat",
    ".cmd",
    ".py",
    ".java",
    ".cpp",
    ".c",
    ".h",
    ".hpp",
    ".php",
    ".rb",
    ".go",
    ".rs",
    ".swift",
    ".sql",
    ".env",
    ".gitignore",
    ".dockerignore",
  ]

  // Check mimetype
  if (editableMimeTypes.some((type) => mimetype.startsWith(type))) {
    return true
  }

  // Check file extension
  const extension = filename.toLowerCase().substring(filename.lastIndexOf("."))
  return editableExtensions.includes(extension)
}
