# Plan: Blog + Changelog Features

## Overview

Two new features:

1. **Blog** — Markdown-based blog posts with categories and scheduled publishing. Written in the admin panel using a Monaco split-editor (left: markdown source, right: live preview). Categories are stored as plain strings and grouped dynamically.
2. **Changelog** — Short "what's new" entries with an optional link to a blog post. Displayed as a compact strip on the landing page (after the hero section, before the Tools section).

**Decisions already made:**
- Images: deferred — markdown supports external image URLs natively; no upload infra yet
- Single language: no per-locale content, one `content` field per post
- Blog editor: Monaco split-pane (left markdown source, right live preview)
- Slug generation: auto-generated from title, editable in admin
- Changelog placement: small strip/sidebar after hero section (3–5 entries)

---

## Phase 1 — Database (Prisma)

**File: `prisma/schema.prisma`** — Add two new models at the end of the file:

```prisma
model BlogPost {
  id          String    @id @default(cuid())
  slug        String    @unique
  title       String
  content     String    // Markdown source
  category    String    @default("")
  published   Boolean   @default(false)
  publishedAt DateTime? // null = publish immediately; future date = scheduled

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  changelogEntries ChangelogEntry[]
}

model ChangelogEntry {
  id          String    @id @default(cuid())
  title       String
  text        String
  published   Boolean   @default(false)
  publishedAt DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  blogPostId String?
  blogPost   BlogPost? @relation(fields: [blogPostId], references: [id], onDelete: SetNull)
}
```

**Publishing rule (used in all public queries):**
```
published = true AND (publishedAt IS NULL OR publishedAt <= NOW())
```
- `publishedAt = null` → visible immediately once `published = true`
- `publishedAt` = past date → visible
- `publishedAt` = future date → scheduled, not visible publicly yet

dont migrate, just generate the 
**Migration command:**
```bash
bunx prisma generate
```

---

## Phase 2 — Dependencies + Typography

### Install
```bash
bun add react-markdown remark-gfm
```

### Enable Typography Plugin
`@tailwindcss/typography` is already in `package.json` as a devDependency but **not configured**.

**Edit `app/globals.css`** — add near the top after existing `@import`/`@plugin` directives:
```css
@plugin "@tailwindcss/typography";
```

This enables the `prose` Tailwind class used by the markdown renderer.

---

## Phase 3 — Shared Markdown Renderer

**New file: `components/blog/MarkdownRenderer.tsx`**

```tsx
'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function MarkdownRenderer({ content }: { content: string }) {
    return (
        <div className="prose prose-neutral dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
            </ReactMarkdown>
        </div>
    );
}
```

Notes:
- Uses standard `<img>` (via rehype default) for images — works with any external URL
- `remark-gfm` adds tables, strikethrough, task lists, autolinks
- `max-w-none` lets the parent container control width

---

## Phase 4 — Server Actions

### `app/actions/blog/blogActions.ts`

```ts
'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';

// Auth helper (reuse pattern from deleteGameServers.ts)
async function requireAdmin() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user.role !== 'admin') throw new Error('Unauthorized');
}

// Slug generation
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
    slug?: string;        // if empty, auto-generated from title
    content: string;
    category: string;
    published: boolean;
    publishedAt?: string | null;  // ISO string
}) {
    await requireAdmin();
    const slug = data.slug?.trim() || slugify(data.title);
    const post = await prisma.blogPost.create({
        data: {
            title: data.title,
            slug,
            content: data.content,
            category: data.category,
            published: data.published,
            publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
        },
    });
    return { success: true, id: post.id, slug: post.slug };
}

export async function updateBlogPost(id: string, data: {
    title?: string;
    slug?: string;
    content?: string;
    category?: string;
    published?: boolean;
    publishedAt?: string | null;
}) {
    await requireAdmin();
    await prisma.blogPost.update({
        where: { id },
        data: {
            ...data,
            publishedAt: data.publishedAt !== undefined
                ? (data.publishedAt ? new Date(data.publishedAt) : null)
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

const publishedFilter = {
    published: true,
    OR: [
        { publishedAt: null },
        { publishedAt: { lte: new Date() } },
    ],
};

export async function getPublishedBlogPosts(category?: string) {
    return prisma.blogPost.findMany({
        where: {
            ...publishedFilter,
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
            content: true, // needed for excerpt generation (first ~150 chars)
        },
    });
}

export async function getBlogPostBySlug(slug: string) {
    return prisma.blogPost.findFirst({
        where: { slug, ...publishedFilter },
    });
}

export async function getBlogCategories(): Promise<string[]> {
    const result = await prisma.blogPost.groupBy({
        by: ['category'],
        where: { published: true, category: { not: '' } },
    });
    return result.map((r) => r.category).filter(Boolean);
}
```

---

### `app/actions/changelog/changelogActions.ts`

```ts
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

export async function updateChangelogEntry(id: string, data: {
    title?: string;
    text?: string;
    published?: boolean;
    publishedAt?: string | null;
    blogPostId?: string | null;
}) {
    await requireAdmin();
    await prisma.changelogEntry.update({
        where: { id },
        data: {
            ...data,
            publishedAt: data.publishedAt !== undefined
                ? (data.publishedAt ? new Date(data.publishedAt) : null)
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
```

---

## Phase 5 — Admin Blog UI

### File tree

```
app/[locale]/admin/blog/
  page.tsx                  ← server: list all posts
  new/
    page.tsx                ← server wrapper → BlogPostForm (create)
  [id]/
    edit/
      page.tsx              ← server: fetch post → BlogPostForm (edit)

components/admin/blog/
  BlogPostForm.tsx          ← client: split Monaco editor form
```

---

### `app/[locale]/admin/blog/page.tsx`

Server component. Calls `listBlogPostsAdmin()`. Renders a table with:
- Title (link to edit)
- Slug
- Category badge
- Status badge: `Draft` (grey) / `Scheduled` (amber, publishedAt > now) / `Published` (green)
- Published date or "Immediately"
- Created date
- Delete button (calls `deleteBlogPost` action)
- "New Post" button → `/admin/blog/new`

Status calculation:
```ts
function getStatus(post: { published: boolean; publishedAt: Date | null }) {
    if (!post.published) return 'Draft';
    if (post.publishedAt && post.publishedAt > new Date()) return 'Scheduled';
    return 'Published';
}
```

---

### `components/admin/blog/BlogPostForm.tsx`

**Client component.** Props: `post?: BlogPost` (undefined = create mode), `existingCategories: string[]`, `allBlogPosts?: never` (not needed here).

Form fields:
| Field | Type | Notes |
|---|---|---|
| `title` | text input | onChange: auto-update slug if user hasn't manually changed it |
| `slug` | text input | editable; auto-populated from title |
| `category` | text input + `<datalist>` | suggests `existingCategories` |
| `published` | Switch (shadcn) | |
| `publishedAt` | `<input type="datetime-local">` | only relevant when `published = true` |
| `content` | Monaco (left) + MarkdownRenderer (right) | split pane |

**Monaco loading pattern** (same as `KeyValueClient.tsx`):
```tsx
const MonacoEditor = dynamic(() => import('@monaco-editor/react').then((m) => m.default), {
    ssr: false,
    loading: () => <div className="flex h-full items-center justify-center ..."><Loader2 .../></div>,
});
```

**Layout:**
```
┌─────────────────────────────────────────┐
│  Title  [input]        Slug  [input]    │
│  Category [input+datalist]              │
│  Published [switch]   PublishedAt [dt]  │
├──────────────────┬──────────────────────┤
│  Monaco editor   │  MarkdownRenderer    │
│  (markdown)      │  (live preview)      │
│                  │                      │
├──────────────────┴──────────────────────┤
│  [Cancel]                    [Save]     │
└─────────────────────────────────────────┘
```

Save calls `createBlogPost` or `updateBlogPost`, then `router.push('/admin/blog')` on success.

---

### Admin tile addition — `app/[locale]/admin/adminPage.tsx`

Add two tiles to the `tiles` array:
```ts
{ name: 'Blog', link: '/admin/blog', Icon: BookOpen, color: 'from-teal-500 to-cyan-600' },
{ name: 'Changelog', link: '/admin/changelog', Icon: History, color: 'from-violet-500 to-purple-600' },
```

Import `BookOpen` and `History` from `lucide-react`.

---

## Phase 6 — Admin Changelog UI

### File tree

```
app/[locale]/admin/changelog/
  page.tsx
  new/
    page.tsx
  [id]/
    edit/
      page.tsx

components/admin/changelog/
  ChangelogEntryForm.tsx
```

---

### `components/admin/changelog/ChangelogEntryForm.tsx`

**Client component.** Props: `entry?: ChangelogEntry & { blogPost: ... }`, `publishedBlogPosts: { id: string; title: string }[]`.

Form fields:
| Field | Type | Notes |
|---|---|---|
| `title` | text input | |
| `text` | textarea | short text, no markdown |
| `blogPostId` | Select (shadcn) or native select | optional; shows title list; "None" option |
| `published` | Switch | |
| `publishedAt` | datetime-local input | |

Save calls `createChangelogEntry` or `updateChangelogEntry`.

The `new/page.tsx` and `[id]/edit/page.tsx` server pages pass `publishedBlogPosts` (fetched via `listBlogPostsAdmin()` filtered to published) as a prop.

---

## Phase 7 — Public Blog

### `app/[locale]/blog/page.tsx`

Server component with optional `?category=` query param.

```
┌──────────────────────────────────────┐
│  Blog                                │
│  [All] [Gaming] [Updates] [Guides]   │  ← category filter (client interaction)
│                                      │
│  ┌──────────────────────────────┐   │
│  │ [Category badge] Mar 13 2026 │   │
│  │ Post Title                   │   │
│  │ Excerpt text here...         │   │
│  │                Read more →   │   │
│  └──────────────────────────────┘   │
│  ...                                 │
└──────────────────────────────────────┘
```

- Reads `category` from `searchParams`
- Fetches `getPublishedBlogPosts(category)` and `getBlogCategories()`
- Category filter is a row of links (`/blog?category=X`), "All" = `/blog`
- Excerpt: strip markdown syntax, take first 150 characters

---

### `app/[locale]/blog/[slug]/page.tsx`

Server component.

- Fetches `getBlogPostBySlug(params.slug)`
- Returns 404 if not found or not published
- Renders:
  - Title (`h1`)
  - Category badge + published date
  - `<MarkdownRenderer content={post.content} />`

---

## Phase 8 — Changelog Strip on Landing Page

### `components/landing/ChangelogStrip.tsx`

Server component. Fetches `getPublishedChangelog(4)`.

**Layout** (vertical mini-timeline, placed after hero as a full-width section before the Tools Card):

```
What's New
──────────────────────────────────
Mar 13  Free Server Feature        →  Read more
Mar 10  Improved billing UI
Mar 7   Discord OAuth support      →  Read more
Mar 1   Launched Lake 1.5
──────────────────────────────────
         View all changes  →
```

Each row:
- Date (`publishedAt ?? createdAt`), formatted compact (e.g. `Mar 13`)
- Title
- Optional "Read more →" link to `/blog/[slug]` if `blogPost` is set

"View all" link navigates to a future `/changelog` route (can be a bare page listing all entries, very simple).

---

### `app/[locale]/page.tsx` modification

Insert between hero section close and the Tools Card section:

```tsx
import { ChangelogStrip } from '@/components/landing/ChangelogStrip';

// ... inside return, after </section> (hero end) and before the Card (tools):
<ChangelogStrip />
```

---

## Phase 9 — i18n Keys

### `messages/en.json` additions

```json
{
  "blog": {
    "title": "Blog",
    "listTitle": "Latest Posts",
    "readMore": "Read more",
    "noPosts": "No posts yet.",
    "allCategories": "All",
    "publishedOn": "Published on",
    "draft": "Draft",
    "scheduled": "Scheduled",
    "published": "Published",
    "category": "Category"
  },
  "changelog": {
    "title": "What's New",
    "readMore": "Read more",
    "viewAll": "View all changes"
  },
  "adminBlog": {
    "title": "Blog Posts",
    "new": "New Post",
    "edit": "Edit Post",
    "slug": "Slug",
    "category": "Category",
    "publishedAt": "Publish Date",
    "published": "Published",
    "content": "Content (Markdown)",
    "preview": "Preview",
    "saveSuccess": "Post saved.",
    "deleteSuccess": "Post deleted.",
    "noPostsYet": "No blog posts yet.",
    "draft": "Draft",
    "scheduled": "Scheduled"
  },
  "adminChangelog": {
    "title": "Changelog",
    "new": "New Entry",
    "edit": "Edit Entry",
    "text": "Short description",
    "blogPost": "Related blog post",
    "noBlogPost": "None",
    "saveSuccess": "Entry saved.",
    "deleteSuccess": "Entry deleted."
  }
}
```

### `messages/de.json` — same structure, German strings

---

## Full File Inventory

| File | Action | Notes |
|---|---|---|
| `prisma/schema.prisma` | Edit — add 2 models | `BlogPost`, `ChangelogEntry` |
| `app/globals.css` | Edit — 1 line | Enable typography plugin |
| `app/actions/blog/blogActions.ts` | **New** | CRUD + public queries |
| `app/actions/changelog/changelogActions.ts` | **New** | CRUD + public query |
| `components/blog/MarkdownRenderer.tsx` | **New** | react-markdown + remark-gfm |
| `components/admin/blog/BlogPostForm.tsx` | **New** | Monaco split-editor form |
| `components/admin/changelog/ChangelogEntryForm.tsx` | **New** | Changelog form |
| `components/landing/ChangelogStrip.tsx` | **New** | Landing page widget |
| `app/[locale]/blog/page.tsx` | **New** | Public blog list |
| `app/[locale]/blog/[slug]/page.tsx` | **New** | Public post detail |
| `app/[locale]/admin/blog/page.tsx` | **New** | Admin: list posts |
| `app/[locale]/admin/blog/new/page.tsx` | **New** | Admin: create post |
| `app/[locale]/admin/blog/[id]/edit/page.tsx` | **New** | Admin: edit post |
| `app/[locale]/admin/changelog/page.tsx` | **New** | Admin: list entries |
| `app/[locale]/admin/changelog/new/page.tsx` | **New** | Admin: create entry |
| `app/[locale]/admin/changelog/[id]/edit/page.tsx` | **New** | Admin: edit entry |
| `app/[locale]/admin/adminPage.tsx` | Edit — add 2 tiles | Blog + Changelog |
| `app/[locale]/page.tsx` | Edit — insert 1 component | ChangelogStrip |
| `messages/en.json` | Edit — add 4 key groups | blog, changelog, adminBlog, adminChangelog |
| `messages/de.json` | Edit — add 4 key groups | Same structure, German |

**Total: 4 edited files, 16 new files**

---

## Verification Checklist

- [ ] `bunx prisma migrate dev --name add_blog_changelog` completes without errors
- [ ] `bun build` passes with no TypeScript errors
- [ ] Admin: create a draft post → not visible on `/blog`
- [ ] Admin: set `publishedAt` = past + `published=true` → visible on `/blog/[slug]`
- [ ] Admin: set `publishedAt` = future + `published=true` → NOT visible publicly
- [ ] Admin: edit post, change slug → redirect works correctly
- [ ] Category filter on `/blog` groups posts correctly, "All" shows all
- [ ] Changelog strip renders on landing page (up to 4 entries)
- [ ] Changelog entry with blog post link → "Read more" links to `/blog/[slug]`
- [ ] Markdown rendering: headings, bold, italic, links, tables, code blocks, external image URLs
- [ ] Dark mode: `prose-invert` applies correctly in MarkdownRenderer
- [ ] Admin delete: post/entry is removed and list refreshes

---

## Out of Scope (can be added later)

- Image upload to server (Docker volume-based file upload API)
- Per-locale blog content (de/en separate)
- Comments
- RSS feed
- Author attribution
- Full `/changelog` page (only the landing strip for now)
- Search across blog posts
