'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { createBlogPost, updateBlogPost } from '@/app/actions/blog/blogActions';
import { MarkdownRenderer } from '@/components/blog/MarkdownRenderer';

const MonacoEditor = dynamic(() => import('@monaco-editor/react').then((m) => m.default), {
    ssr: false,
    loading: () => (
        <div className="flex h-full items-center justify-center rounded border bg-muted text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading editor...
        </div>
    ),
});

const CHANGELOG_TYPES = ['NEW', 'IMPROVED', 'FIXED', 'SECURITY', 'REMOVED'] as const;

function slugify(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
}

interface BlogPostFormProps {
    post?: {
        id: string;
        title: string;
        slug: string;
        content: string;
        category: string;
        published: boolean;
        listed: boolean;
        publishedAt: Date;
    };
    existingCategories: string[];
}

export default function BlogPostForm({ post, existingCategories }: BlogPostFormProps) {
    const router = useRouter();
    const { toast } = useToast();
    const { theme } = useTheme();
    const [isPending, setIsPending] = useState(false);

    const [title, setTitle] = useState(post?.title ?? '');
    const [slug, setSlug] = useState(post?.slug ?? '');
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!post);
    const [content, setContent] = useState(post?.content ?? '');
    const [category, setCategory] = useState(post?.category ?? '');
    const [published, setPublished] = useState(post?.published ?? false);
    const [listed, setListed] = useState(post?.listed ?? true);
    const [publishedAt, setPublishedAt] = useState(
        post?.publishedAt ? toDatetimeLocal(post.publishedAt) : '',
    );

    // Changelog creation (only for new posts)
    const [createChangelog, setCreateChangelog] = useState(false);
    const [clText, setClText] = useState('');
    const [clType, setClType] = useState<string>('NEW');

    function toDatetimeLocal(d: Date): string {
        const dt = new Date(d);
        dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset());
        return dt.toISOString().slice(0, 16);
    }

    function handleTitleChange(val: string) {
        setTitle(val);
        if (!slugManuallyEdited) {
            setSlug(slugify(val));
        }
    }

    function handleSlugChange(val: string) {
        setSlugManuallyEdited(true);
        setSlug(val);
    }

    async function handleSave() {
        setIsPending(true);
        try {
            if (post) {
                await updateBlogPost(post.id, {
                    title,
                    slug,
                    content,
                    category,
                    published,
                    listed,
                    publishedAt: publishedAt ? new Date(publishedAt).toISOString() : null,
                });
            } else {
                await createBlogPost({
                    title,
                    slug,
                    content,
                    category,
                    published,
                    listed,
                    publishedAt: publishedAt ? new Date(publishedAt).toISOString() : null,
                    ...(createChangelog
                        ? {
                              changelog: {
                                  text: clText,
                                  type: clType,
                                  published,
                                  publishedAt: publishedAt
                                      ? new Date(publishedAt).toISOString()
                                      : null,
                              },
                          }
                        : {}),
                });
            }
            toast({ title: 'Saved', description: 'Post saved.' });
            router.push('/admin/blog');
        } catch (err: unknown) {
            setIsPending(false);
            toast({
                title: 'Error',
                description: err instanceof Error ? err.message : 'Unknown error',
                variant: 'destructive',
            });
        }
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Title + Slug row */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                    <Label htmlFor="blog-title">Title</Label>
                    <Input
                        id="blog-title"
                        value={title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        placeholder="Post title"
                    />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="blog-slug">Slug</Label>
                    <Input
                        id="blog-slug"
                        value={slug}
                        onChange={(e) => handleSlugChange(e.target.value)}
                        placeholder="post-slug"
                        className="font-mono"
                    />
                </div>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
                <Label htmlFor="blog-category">Category</Label>
                <Input
                    id="blog-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Updates, Guides..."
                    list="blog-categories"
                />
                <datalist id="blog-categories">
                    {existingCategories.map((c) => (
                        <option key={c} value={c} />
                    ))}
                </datalist>
            </div>

            {/* Published + Listed + PublishedAt row */}
            <div className="flex flex-wrap items-end gap-6">
                <div className="flex items-center gap-3">
                    <Switch
                        id="blog-published"
                        checked={published}
                        onCheckedChange={setPublished}
                    />
                    <Label htmlFor="blog-published" className="cursor-pointer">
                        Enabled
                    </Label>
                </div>
                <div className="flex items-center gap-3">
                    <Switch id="blog-listed" checked={listed} onCheckedChange={setListed} />
                    <Label htmlFor="blog-listed" className="cursor-pointer">
                        Listed
                    </Label>
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="blog-publishedAt">Publish Date</Label>
                    <Input
                        id="blog-publishedAt"
                        type="datetime-local"
                        value={publishedAt}
                        onChange={(e) => setPublishedAt(e.target.value)}
                        className="w-auto"
                    />
                </div>
            </div>

            {/* Monaco + Preview split */}
            <div className="grid min-h-100 grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="space-y-1.5">
                    <Label>Content (Markdown)</Label>
                    <div className="h-100 overflow-hidden rounded border">
                        <MonacoEditor
                            height="100%"
                            language="markdown"
                            theme={theme === 'dark' ? 'vs-dark' : 'light'}
                            value={content}
                            onChange={(v) => setContent(v ?? '')}
                            options={{
                                minimap: { enabled: false },
                                wordWrap: 'on',
                                scrollBeyondLastLine: false,
                                fontSize: 13,
                            }}
                        />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <Label>Preview</Label>
                    <div className="h-100 overflow-y-auto rounded border p-4">
                        <MarkdownRenderer content={content} />
                    </div>
                </div>
            </div>

            {/* Create Changelog Entry (new posts only) */}
            {!post && (
                <div className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-center gap-3">
                        <Switch
                            id="blog-create-changelog"
                            checked={createChangelog}
                            onCheckedChange={setCreateChangelog}
                        />
                        <Label htmlFor="blog-create-changelog" className="cursor-pointer">
                            Also create a changelog entry
                        </Label>
                    </div>
                    {createChangelog && (
                        <div className="flex flex-col gap-3 pt-1">
                            <div className="space-y-1.5">
                                <Label>Changelog Type</Label>
                                <Select value={clType} onValueChange={setClType}>
                                    <SelectTrigger className="w-40">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CHANGELOG_TYPES.map((t) => (
                                            <SelectItem key={t} value={t}>
                                                {t.charAt(0) + t.slice(1).toLowerCase()}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Short description</Label>
                                <Textarea
                                    value={clText}
                                    onChange={(e) => setClText(e.target.value)}
                                    placeholder="Brief summary for the changelog..."
                                    rows={2}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                The changelog entry will use the same title, publish state, and date
                                as this blog post.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Actions */}
            <div className="flex justify-between">
                <Button variant="outline" onClick={() => router.push('/admin/blog')}>
                    Cancel
                </Button>
                <Button onClick={handleSave} disabled={isPending || !title.trim()}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {post ? 'Save Changes' : 'Create Post'}
                </Button>
            </div>
        </div>
    );
}
