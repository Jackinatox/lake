'use server';

import { auth } from '@/auth';
import { blogPostCreateSchema, blogPostUpdateSchema } from '@/lib/validation/adminContent';
import { getValidationMessage, nonEmptyIdSchema, parseDateInput } from '@/lib/validation/common';
import prisma from '@/lib/prisma';
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
    const parsed = (() => {
        try {
            return blogPostCreateSchema.parse(data);
        } catch (error) {
            throw new Error(getValidationMessage(error));
        }
    })();
    const slug = parsed.slug?.trim() || slugify(parsed.title);
    const publishedAt = parseDateInput(parsed.publishedAt) ?? new Date();

    const post = await prisma.blogPost.create({
        data: {
            title: parsed.title,
            slug,
            content: parsed.content,
            category: parsed.category,
            published: parsed.published,
            listed: parsed.listed,
            publishedAt,
        },
    });

    if (parsed.changelog) {
        await prisma.changelogEntry.create({
            data: {
                title: parsed.title,
                text: parsed.changelog.text,
                type: parsed.changelog.type,
                published: parsed.changelog.published,
                publishedAt: parseDateInput(parsed.changelog.publishedAt) ?? publishedAt,
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
    const parsed = (() => {
        try {
            return blogPostUpdateSchema.parse(data);
        } catch (error) {
            throw new Error(getValidationMessage(error));
        }
    })();
    await prisma.blogPost.update({
        where: { id: nonEmptyIdSchema.parse(id) },
        data: {
            title: parsed.title,
            slug: parsed.slug,
            content: parsed.content,
            category: parsed.category,
            published: parsed.published,
            listed: parsed.listed,
            publishedAt:
                parsed.publishedAt !== undefined
                    ? (parseDateInput(parsed.publishedAt) ?? new Date())
                    : undefined,
        },
    });
    return { success: true };
}

export async function deleteBlogPost(id: string) {
    await requireAdmin();
    await prisma.blogPost.delete({ where: { id: nonEmptyIdSchema.parse(id) } });
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
    return prisma.blogPost.findUniqueOrThrow({ where: { id: nonEmptyIdSchema.parse(id) } });
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
