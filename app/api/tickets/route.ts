import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers() // you need to pass the headers object.
        })

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await req.json();
        if (!data.description) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const ticket = await prisma.supportTicket.create({
            data: {
                userId: session.user.id,
                title: null,
                message: data.description,
                status: 'OPEN',
            }
        });
        // TODO: Notify Admin/Supporters about new ticket

        return NextResponse.json({ ticket: ticket }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: JSON.stringify(error) }, { status: 400 });
    }
}