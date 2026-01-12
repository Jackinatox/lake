import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
    return new Response('Use Post method', { status: 405 });
}

export async function POST(req: NextRequest) {
    return new Response('Testing route is operational', { status: 200 });
}
