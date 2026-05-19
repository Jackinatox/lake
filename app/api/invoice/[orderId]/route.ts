import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { orderIdSchema } from '@/lib/validation/common';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

// Temporary endpoint: serves invoice PDFs stored in our DB so we don't
// depend on Stripe's hosted URL. When we migrate to S3, swap the storage
// backend here (or repoint invoicePdfUrl directly to S3) — nothing else
// needs to change.
export async function GET(
    _request: Request,
    { params }: { params: Promise<{ orderId: string }> },
) {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = await params;
    const parsedOrderId = orderIdSchema.safeParse(orderId);
    if (!parsedOrderId.success) {
        return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    const isAdmin = session.user.role === 'admin';
    const order = await prisma.gameServerOrder.findFirst({
        where: {
            id: parsedOrderId.data,
            ...(isAdmin ? {} : { userId: session.user.id }),
        },
        select: { id: true, stripeInvoiceNumber: true },
    });

    if (!order) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const pdf = await prisma.invoicePdf.findUnique({
        where: { orderId: order.id },
        select: { data: true },
    });

    if (!pdf) {
        return NextResponse.json({ error: 'Invoice not available yet' }, { status: 404 });
    }

    const filename = `invoice-${order.stripeInvoiceNumber ?? order.id}.pdf`;
    return new NextResponse(new Uint8Array(pdf.data), {
        status: 200,
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="${filename}"`,
            'Cache-Control': 'private, no-store',
        },
    });
}
