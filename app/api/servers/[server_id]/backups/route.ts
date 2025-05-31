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
            `${baseUrl}/api/client/servers/${serverId}/backups`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${ptApiKey}`,
                    // Authorization: `Bearer ptlc_dUhOyxSMfmFeeAbOyOzIZiuyOXs0qX0pLEOt5F76VpP`,
                    Accept: "application/json",
                    "Content-Type": "application/json",
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

    } catch (error) {
        return NextResponse.json({ error: 'An error occurred', details: String(error) }, { status: 500 });
    }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ server_id: string }> }) {
    try {
        const serverId = (await params).server_id;
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 403 });
        }

        const ptApiKey = session?.user.ptKey;

        // Parse the request body to get the backup name
        let body;
        let backupName;
        try {
            body = await request.json();
            backupName = body.name;
            if (!backupName || typeof backupName !== 'string' || !backupName.trim()) {
                throw new Error();
            }
        } catch {
            return NextResponse.json({ error: 'Missing or invalid backup name. Please provide a valid name in the JSON body.' }, { status: 400 });
        }


        const response = await fetch(
            `${baseUrl}/api/client/servers/${serverId}/backups`,
            {
                method: "POST",
                headers: {
                    // Authorization: `Bearer ${ptApiKey}`,
                    Authorization: `Bearer ptlc_dUhOyxSMfmFeeAbOyOzIZiuyOXs0qX0pLEOt5F76VpP`,
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name: backupName.trim() })
            },
        )

        if (response.status === 403 || response.status === 404) {
            return NextResponse.json({ error: "Access denied", redirect: "/gameserver" }, { status: 403 })
        }

        if (response.status === 429) {
            return NextResponse.json({ error: "You can only create Backups every 10 minutes" }, { status: 429 })
        }

        if (!response.ok) {
            const errorText = await response.text()
            return NextResponse.json({ error: `Pterodactyl API error: ${errorText}` }, { status: response.status })
        }

        const data = await response.json();
        return NextResponse.json(data.attributes)
    } catch (error) {
        return NextResponse.json({ error: 'An error occurred', details: String(error) }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ server_id: string }> }) {
    try {
        const serverId = (await params).server_id;
        const backupId = request.nextUrl.searchParams.get('backupId');
        if (!backupId) {
            return NextResponse.json({ error: 'Missing backupId in query parameters.' }, { status: 400 });
        }

        // console.log(serverId, backupId)

        const session = await auth();

        if (!session?.user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 403 });
        }

        const ptApiKey = session?.user.ptKey;

        const anPT = `${baseUrl}/api/client/servers/${serverId}/backups/${backupId}`;
        console.log(anPT)
        const response = await fetch(
            anPT,
            {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${ptApiKey}`,
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
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