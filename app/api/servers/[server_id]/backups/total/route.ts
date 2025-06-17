import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

const baseUrl = process.env.NEXT_PUBLIC_PTERODACTYL_URL


export async function GET(request: NextRequest, { params }: { params: Promise<{ server_id: string }> }) {
    try {
        const serverId = (await params).server_id;

        const session = await auth();

        if (!session?.user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 403 });
        }

        const ptApiKey = session?.user.ptKey;

        const response = await fetch(
            `${baseUrl}/api/client/servers/${serverId}`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${ptApiKey}`,
                    Accept: "application/json",
                    "Content-Type": "application/json"
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

        const data = await response.json();
        return NextResponse.json({totalBackups: data.attributes.feature_limits.backups})

    } catch (error) {
        return NextResponse.json({ error: 'An error occurred', details: String(error) }, { status: 500 });
    }
}