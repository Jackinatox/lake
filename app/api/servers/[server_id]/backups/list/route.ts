import { auth } from "@/auth";
import { error } from "console";
import { NextRequest, NextResponse } from "next/server";

const baseUrl = process.env.NEXT_PUBLIC_PTERODACTYL_URL


export async function GET(request: NextRequest, { params }: { params: Promise<{ server_id: string }> }) {
    try {
        const serverId = (await params).server_id;

        // const session = await auth();

        // if (!session?.user) {
        //     return NextResponse.json({ error: 'Not authenticated' }, { status: 403 });
        // }

        // const ptApiKey = session?.user.ptKey;

        const response = await fetch(
            `${baseUrl}/api/client/servers/${serverId}/backups`,
            {
                method: "GET",
                headers: {
                    // Authorization: `Bearer ${ptApiKey}`,
                    Authorization: `Bearer ptlc_dUhOyxSMfmFeeAbOyOzIZiuyOXs0qX0pLEOt5F76VpP`,
                    "Content-Type": "text/plain",
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
    return NextResponse.json(data.data)     

    } catch {
        return NextResponse.json({ error: 'an Error occured' }, { status: 500 });
    }
}