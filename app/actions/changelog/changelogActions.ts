'use server';

import { auth } from '@/auth';
import {
    changelogEntryCreateSchema,
    changelogEntryUpdateSchema,
} from '@/lib/validation/adminContent';
import { getValidationMessage, nonEmptyIdSchema, parseDateInput } from '@/lib/validation/common';
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
    type: string;
    published: boolean;
    publishedAt?: string | null;
    blogPostId?: string | null;
}) {
    await requireAdmin();
    const parsed = (() => {
        try {
            return changelogEntryCreateSchema.parse(data);
        } catch (error) {
            throw new Error(getValidationMessage(error));
        }
    })();
    await prisma.changelogEntry.create({
        data: {
            title: parsed.title,
            text: parsed.text,
            type: parsed.type,
            published: parsed.published,
            publishedAt: parseDateInput(parsed.publishedAt) ?? new Date(),
            blogPostId: parsed.blogPostId ?? null,
        },
    });
    return { success: true };
}

export async function updateChangelogEntry(
    id: string,
    data: {
        title?: string;
        text?: string;
        type?: string;
        published?: boolean;
        publishedAt?: string | null;
        blogPostId?: string | null;
    },
) {
    await requireAdmin();
    const parsed = (() => {
        try {
            return changelogEntryUpdateSchema.parse(data);
        } catch (error) {
            throw new Error(getValidationMessage(error));
        }
    })();
    await prisma.changelogEntry.update({
        where: { id: nonEmptyIdSchema.parse(id) },
        data: {
            title: parsed.title,
            text: parsed.text,
            type: parsed.type,
            published: parsed.published,
            blogPostId: parsed.blogPostId,
            publishedAt:
                parsed.publishedAt !== undefined
                    ? (parseDateInput(parsed.publishedAt) ?? new Date())
                    : undefined,
        },
    });
    return { success: true };
}

export async function deleteChangelogEntry(id: string) {
    await requireAdmin();
    await prisma.changelogEntry.delete({ where: { id: nonEmptyIdSchema.parse(id) } });
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
        where: { id: nonEmptyIdSchema.parse(id) },
        include: { blogPost: { select: { id: true, title: true } } },
    });
}

// ── Public queries ───────────────────────────────────────────

export async function getPublishedChangelog(limit = 5) {
    const now = new Date();
    const entries = await prisma.changelogEntry.findMany({
        where: {
            published: true,
            publishedAt: { lte: now },
        },
        orderBy: { publishedAt: 'desc' },
        take: limit,
        select: {
            id: true,
            title: true,
            text: true,
            type: true,
            publishedAt: true,
            blogPost: {
                select: { slug: true, published: true, publishedAt: true },
            },
        },
    });

    // Only expose the blog link if the blog post is actually visible
    return entries.map((entry) => {
        const bp = entry.blogPost;
        const blogPostVisible = bp?.published && bp.publishedAt <= now;
        return {
            ...entry,
            blogPost: blogPostVisible ? { slug: bp.slug } : null,
        };
    });
}
