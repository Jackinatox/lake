'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { ChangelogEntryType } from '@/app/client/generated/enums';
import { headers } from 'next/headers';

async function requireAdmin() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user.role !== 'admin') throw new Error('Unauthorized');
}

function slugify(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
}

// ── Admin mutations ──────────────────────────────────────────

export async function createBlogPost(data: {
    title: string;
    slug?: string;
    content: string;
    category: string;
    published: boolean;
    listed: boolean;
    publishedAt?: string | null;
    changelog?: {
        text: string;
        type: string;
        published: boolean;
        publishedAt?: string | null;
    };
}) {
    await requireAdmin();
    const slug = data.slug?.trim() || slugify(data.title);
    const publishedAt = data.publishedAt ? new Date(data.publishedAt) : new Date();

    const post = await prisma.blogPost.create({
        data: {
            title: data.title,
            slug,
            content: data.content,
            category: data.category,
            published: data.published,
            listed: data.listed,
            publishedAt,
        },
    });

    if (data.changelog) {
        await prisma.changelogEntry.create({
            data: {
                title: data.title,
                text: data.changelog.text,
                type: data.changelog.type as ChangelogEntryType,
                published: data.changelog.published,
                publishedAt: data.changelog.publishedAt
                    ? new Date(data.changelog.publishedAt)
                    : publishedAt,
                blogPostId: post.id,
            },
        });
    }

    return { success: true, id: post.id, slug: post.slug };
}

export async function updateBlogPost(
    id: string,
    data: {
        title?: string;
        slug?: string;
        content?: string;
        category?: string;
        published?: boolean;
        listed?: boolean;
        publishedAt?: string | null;
    },
) {
    await requireAdmin();
    await prisma.blogPost.update({
        where: { id },
        data: {
            title: data.title,
            slug: data.slug,
            content: data.content,
            category: data.category,
            published: data.published,
            listed: data.listed,
            publishedAt:
                data.publishedAt !== undefined
                    ? data.publishedAt
                        ? new Date(data.publishedAt)
                        : new Date()
                    : undefined,
        },
    });
    return { success: true };
}

export async function deleteBlogPost(id: string) {
    await requireAdmin();
    await prisma.blogPost.delete({ where: { id } });
    return { success: true };
}

// ── Admin queries ────────────────────────────────────────────

export async function listBlogPostsAdmin() {
    await requireAdmin();
    return prisma.blogPost.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            title: true,
            slug: true,
            category: true,
            published: true,
            listed: true,
            publishedAt: true,
            createdAt: true,
        },
    });
}

export async function getBlogPostForEdit(id: string) {
    await requireAdmin();
    return prisma.blogPost.findUniqueOrThrow({ where: { id } });
}

// ── Public queries ───────────────────────────────────────────

function publishedFilter() {
    return {
        published: true,
        publishedAt: { lte: new Date() },
    };
}

export async function getPublishedBlogPosts(category?: string) {
    return prisma.blogPost.findMany({
        where: {
            ...publishedFilter(),
            listed: true,
            ...(category ? { category } : {}),
        },
        orderBy: { publishedAt: 'desc' },
        select: {
            id: true,
            title: true,
            slug: true,
            category: true,
            publishedAt: true,
            createdAt: true,
            content: true,
        },
    });
}

export async function getBlogPostBySlug(slug: string) {
    return prisma.blogPost.findFirst({
        where: { slug, ...publishedFilter() },
    });
}

export async function getBlogCategories(): Promise<string[]> {
    const result = await prisma.blogPost.groupBy({
        by: ['category'],
        where: { ...publishedFilter(), listed: true, category: { not: '' } },
    });
    return result.map((r) => r.category).filter(Boolean);
}
