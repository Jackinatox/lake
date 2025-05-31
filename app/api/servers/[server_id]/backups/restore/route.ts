import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

const baseUrl = process.env.NEXT_PUBLIC_PTERODACTYL_URL

export async function POST(request: NextRequest, { params }: { params: Promise<{ server_id: string }> }) {
    try {
        const serverId = (await params).server_id;
        const body = await request.json();
        const backupId = body.backupId;
        const truncate = Boolean(body.truncate);

        if (!backupId) {
            return NextResponse.json({ error: 'Missing backupId in request body.' }, { status: 400 });
        }

        const session = await auth();

        if (!session?.user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 403 });
        }

        const ptApiKey = session?.user.ptKey;

        const anPT = `${baseUrl}/api/client/servers/${serverId}/backups/${backupId}/restore`;
        console.log(anPT)
        const response = await fetch(
            anPT,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${ptApiKey}`,
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({truncate: truncate})
            },
        )

        if (response.status === 403 || response.status === 404) {
            return NextResponse.json({ error: "Access denied", ptresponse: await response.json()}, { status: 403 })
        }

        if (!response.ok) {
            const errorText = await response.text()
            return NextResponse.json({ error: `Pterodactyl API error: ${errorText}` }, { status: response.status })
        }

        return NextResponse.json({ status: 200 })
    } catch (error) {
        return NextResponse.json({ error: 'An error occurred', details: String(error) }, { status: 500 });
    }
}