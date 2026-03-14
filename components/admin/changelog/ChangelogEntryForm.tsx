'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import {
    createChangelogEntry,
    updateChangelogEntry,
} from '@/app/actions/changelog/changelogActions';

const CHANGELOG_TYPES = ['NEW', 'IMPROVED', 'FIXED', 'SECURITY', 'REMOVED'] as const;

interface ChangelogEntryFormProps {
    entry?: {
        id: string;
        title: string;
        text: string;
        type: string;
        published: boolean;
        publishedAt: Date;
        blogPost: { id: string; title: string } | null;
    };
    publishedBlogPosts: { id: string; title: string }[];
}

export default function ChangelogEntryForm({ entry, publishedBlogPosts }: ChangelogEntryFormProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isPending, setIsPending] = useState(false);

    const [title, setTitle] = useState(entry?.title ?? '');
    const [text, setText] = useState(entry?.text ?? '');
    const [type, setType] = useState(entry?.type ?? 'NEW');
    const [published, setPublished] = useState(entry?.published ?? false);
    const [publishedAt, setPublishedAt] = useState(
        entry?.publishedAt ? toDatetimeLocal(entry.publishedAt) : '',
    );
    const [blogPostId, setBlogPostId] = useState(entry?.blogPost?.id ?? '');

    function toDatetimeLocal(d: Date): string {
        const dt = new Date(d);
        dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset());
        return dt.toISOString().slice(0, 16);
    }

    async function handleSave() {
        setIsPending(true);
        try {
            const data = {
                title,
                text,
                type,
                published,
                publishedAt: publishedAt ? new Date(publishedAt).toISOString() : null,
                blogPostId: blogPostId || null,
            };
            if (entry) {
                await updateChangelogEntry(entry.id, data);
            } else {
                await createChangelogEntry(data);
            }
            toast({ title: 'Saved', description: 'Entry saved.' });
            router.push('/admin/changelog');
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
        <div className="flex w-full flex-col gap-4">
            <div className="space-y-1.5">
                <Label htmlFor="cl-title">Title</Label>
                <Input
                    id="cl-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What changed?"
                />
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="cl-text">Short description</Label>
                <Textarea
                    id="cl-text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Brief description of the change..."
                    rows={3}
                />
            </div>

            <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={type} onValueChange={setType}>
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
                <Label>Related blog post (optional)</Label>
                <Select
                    value={blogPostId || 'none'}
                    onValueChange={(v) => setBlogPostId(v === 'none' ? '' : v)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {publishedBlogPosts.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                                {p.title}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex flex-wrap items-end gap-6">
                <div className="flex items-center gap-3">
                    <Switch id="cl-published" checked={published} onCheckedChange={setPublished} />
                    <Label htmlFor="cl-published" className="cursor-pointer">
                        Published
                    </Label>
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="cl-publishedAt">Publish Date (optional)</Label>
                    <Input
                        id="cl-publishedAt"
                        type="datetime-local"
                        value={publishedAt}
                        onChange={(e) => setPublishedAt(e.target.value)}
                        className="w-auto"
                    />
                </div>
            </div>

            <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => router.push('/admin/changelog')}>
                    Cancel
                </Button>
                <Button onClick={handleSave} disabled={isPending || !title.trim()}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {entry ? 'Save Changes' : 'Create Entry'}
                </Button>
            </div>
        </div>
    );
}
