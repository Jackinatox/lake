import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // const supabase = await createClient();
    // const {
    //   data: { user },
    // } = await supabase.auth.getUser();

    // if (!user) {
    //   return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    // }
    // 1. Parse body from the request
    const { apiKey, serverId } = await req.json();

    // 2. Make the request to the Pterodactyl API
    const pteroResponse = await fetch(`https://pt.scyed.com/api/client/servers/${serverId}/websocket`, {
      method: 'GET',              // or 'POST' if needed
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      // Note: This is a server-side request, so no special CORS handling needed
    });

    // 3. Return the Pterodactyl API response data
    const data = await pteroResponse.json();
    console.log('ws request made by serevr: ', data);
    return NextResponse.json(data, { status: pteroResponse.status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
