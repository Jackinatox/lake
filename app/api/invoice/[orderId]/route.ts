import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { orderIdSchema } from '@/lib/validation/common';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

// Temporary endpoint: serves invoice PDFs stored in our DB so we don't
// depend on Stripe's hosted URL. When we migrate to S3, swap the storage
// backend here (or repoint invoicePdfUrl directly to S3) — nothing else
// needs to change.
/**
 * Browsers show a raw PDF with the URL's last segment (the order id) as tab title, and the PDF
 * viewer asks for a plain `/favicon.ico` that the browser may still have cached from before the
 * Scyed icon. So a desktop browser opening the link directly gets a tiny HTML page with a proper
 * title and icon that embeds the PDF (`?raw=1`). Everything else gets the PDF itself: iframes,
 * downloads, scripts, and mobile browsers, which can't show a PDF inside an iframe.
 */
function wantsViewerPage(request: Request): boolean {
    const url = new URL(request.url);
    if (url.searchParams.has('raw')) return false;
    if (request.headers.get('sec-fetch-dest') !== 'document') return false;
    const mobile =
        request.headers.get('sec-ch-ua-mobile') === '?1' ||
        /Mobi|Android|iPhone|iPad/i.test(request.headers.get('user-agent') ?? '');
    return !mobile;
}

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function viewerPage(title: string, pdfUrl: string): string {
    return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="robots" content="noindex">
<title>${escapeHtml(title)}</title>
<link rel="icon" href="/favicon.ico?v=scyed" type="image/x-icon">
<style>html,body{margin:0;height:100%;background:#525659}iframe{display:block;border:0;width:100%;height:100%}</style>
</head>
<body><iframe src="${escapeHtml(pdfUrl)}" title="${escapeHtml(title)}"></iframe></body>
</html>`;
}

export async function GET(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
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

    if (wantsViewerPage(request)) {
        const hasPdf = await prisma.invoicePdf.count({ where: { orderId: order.id } });
        if (hasPdf) {
            const title = `Rechnung ${order.stripeInvoiceNumber ?? order.id} · Scyed`;
            const pdfUrl = `${new URL(request.url).pathname}?raw=1`;
            return new NextResponse(viewerPage(title, pdfUrl), {
                status: 200,
                headers: {
                    'Content-Type': 'text/html; charset=utf-8',
                    'Cache-Control': 'private, no-store',
                },
            });
        }
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
