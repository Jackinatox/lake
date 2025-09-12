import { auth } from "@/auth"
import { headers } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

const baseUrl = process.env.NEXT_PUBLIC_PTERODACTYL_URL

export async function POST(request: NextRequest, { params }: { params: Promise<{ server_id: string }> }) {
    try {
        const serverId = (await params).server_id
        const { searchParams } = new URL(request.url)
        const file = searchParams.get("file")

        if (!file) {
            return NextResponse.json({ error: "File parameter is required" }, { status: 400 })
        }

        const content = await request.text()

        const session = await auth.api.getSession({
            headers: await headers()
        })

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const ptApiKey = session.user.ptKey;

        if (!ptApiKey) {
            return NextResponse.json({ error: "No Pterodactyl API key found" }, { status: 401 })
        }

        const response = await fetch(
            `${baseUrl}/api/client/servers/${serverId}/files/write?file=${encodeURIComponent(file)}`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${ptApiKey}`,
                    "Content-Type": "text/plain",
                },
                body: content,
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
        console.error("Error in files/write API:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
