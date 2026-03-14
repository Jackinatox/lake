'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';

async function requireAdmin() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user.role !== 'admin') throw new Error('Unauthorized');
}

// ── Admin mutations ──────────────────────────────────────────

export async function createChangelogEntry(data: {
    title: string;
    text: string;
    published: boolean;
    publishedAt?: string | null;
    blogPostId?: string | null;
}) {
    await requireAdmin();
    await prisma.changelogEntry.create({
        data: {
            title: data.title,
            text: data.text,
            published: data.published,
            publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
            blogPostId: data.blogPostId ?? null,
        },
    });
    return { success: true };
}

export async function updateChangelogEntry(
    id: string,
    data: {
        title?: string;
        text?: string;
        published?: boolean;
        publishedAt?: string | null;
        blogPostId?: string | null;
    },
) {
    await requireAdmin();
    await prisma.changelogEntry.update({
        where: { id },
        data: {
            ...data,
            publishedAt:
                data.publishedAt !== undefined
                    ? data.publishedAt
                        ? new Date(data.publishedAt)
                        : null
                    : undefined,
        },
    });
    return { success: true };
}

export async function deleteChangelogEntry(id: string) {
    await requireAdmin();
    await prisma.changelogEntry.delete({ where: { id } });
    return { success: true };
}

// ── Admin queries ────────────────────────────────────────────

export async function listChangelogAdmin() {
    await requireAdmin();
    return prisma.changelogEntry.findMany({
        orderBy: { createdAt: 'desc' },
        include: { blogPost: { select: { title: true, slug: true } } },
    });
}

export async function getChangelogEntryForEdit(id: string) {
    await requireAdmin();
    return prisma.changelogEntry.findUniqueOrThrow({
        where: { id },
        include: { blogPost: { select: { id: true, title: true } } },
    });
}

// ── Public queries ───────────────────────────────────────────

export async function getPublishedChangelog(limit = 5) {
    return prisma.changelogEntry.findMany({
        where: {
            published: true,
            OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }],
        },
        orderBy: { publishedAt: 'desc' },
        take: limit,
        select: {
            id: true,
            title: true,
            text: true,
            publishedAt: true,
            createdAt: true,
            blogPost: { select: { slug: true } },
        },
    });
}
