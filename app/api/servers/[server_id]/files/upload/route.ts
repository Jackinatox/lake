import { auth } from "@/auth"
import { type NextRequest, NextResponse } from "next/server"

const baseUrl = process.env.NEXT_PUBLIC_PTERODACTYL_URL

export async function POST(request: NextRequest, { params }: { params: Promise<{ server_id: string }> }) {
  try {

    return NextResponse.json({ error: "Not implemented yet - Sorry :(" }, { status: 501 });

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

    // Get the form data from the request
    const formData = await request.formData()

    const response = await fetch(
      `${baseUrl}/api/client/servers/${serverId}/files/upload?directory=${encodeURIComponent(directory)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ptApiKey}`,
        },
        body: formData,
      },
    )

    if (response.status === 403 || response.status === 404) {
      return NextResponse.json({ error: "Access denied", redirect: "/gameserver" }, { status: 403 })
    }

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ error: `Pterodactyl API error: ${errorText}` }, { status: response.status })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in files/upload API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
