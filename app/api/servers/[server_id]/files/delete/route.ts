import { auth } from "@/auth";
import { error } from "console";
import { NextRequest, NextResponse } from "next/server";


const baseUrl = process.env.NEXT_PUBLIC_PTERODACTYL_URL

export async function POST(request: NextRequest, { params }: { params: Promise<{ server_id: string }> }) {
    // console.time("Sequential Execution");
    // const serverId = (await params).server_id;
    // const body = await request.json();

    // const session = await auth();

    const [paramsId, body, session] = await Promise.all([params, request.json(), auth()]);
    const serverId = paramsId.server_id;

    if (!session?.user) {
        return NextResponse.json('', { status: 401, statusText: 'invalid auth' });
    }

    const ptApiKey = session?.user.ptKey;
    if (!ptApiKey) {
        return NextResponse.json('', { status: 401, statusText: 'No Pterodactyl Key found' });
    }


    console.log('body: ', body);
    const response = await fetch(`${baseUrl}/api/client/servers/${serverId}/files/delete`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${ptApiKey}`,
                Accept: "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        }
    );

    if (!response.ok) {
        const text = await response.text();
        return NextResponse.json({ error: `error from Pterodactyl: ${ text }` }, {status: 501});
    }

    return NextResponse.json({ success: true });
    // console.timeEnd("Sequential Execution");
}