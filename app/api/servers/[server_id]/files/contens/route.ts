import { createClient } from "@/utils/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

const baseUrl = process.env.NEXT_PUBLIC_PTERODACTYL_URL

export async function GET(request: NextRequest, { params }: { params: Promise<{ server_id: string }> }) {
  try {
    const serverId = (await params).server_id
    const { searchParams } = new URL(request.url)
    const file = searchParams.get("file")

    if (!file) {
      return NextResponse.json({ error: "File parameter is required" }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const ptApiKey = user.user_metadata.pt_api_Key
    if (!ptApiKey) {
      return NextResponse.json({ error: "No Pterodactyl API key found" }, { status: 401 })
    }

    const response = await fetch(
      `${baseUrl}/api/client/servers/${serverId}/files/contents?file=${encodeURIComponent(file)}`,
      {
        headers: {
          Authorization: `Bearer ${ptApiKey}`,
          Accept: "application/json",
        },
      },
    )

    if (response.status === 403 || response.status === 404) {
      return NextResponse.json({ error: "Access denied", redirect: "/gameserver" }, { status: 403 })
    }

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ error: `Pterodactyl API error: ${errorText}` }, { status: response.status })
    }

    const content = await response.text()
    return new NextResponse(content, {
      headers: {
        "Content-Type": "text/plain",
      },
    })
  } catch (error) {
    console.error("Error in files/contents API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
