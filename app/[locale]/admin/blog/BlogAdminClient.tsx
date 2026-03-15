'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { deleteBlogPost } from '@/app/actions/blog/blogActions';

export function DeleteBlogPostButton({ id, title }: { id: string; title: string }) {
    const router = useRouter();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    function handleDelete() {
        startTransition(async () => {
            try {
                await deleteBlogPost(id);
                setOpen(false);
                router.refresh();
                toast({ title: 'Deleted', description: `"${title}" removed.` });
            } catch (err: unknown) {
                toast({
                    title: 'Error',
                    description: err instanceof Error ? err.message : 'Unknown error',
                    variant: 'destructive',
                });
            }
        });
    }

    return (
        <>
            <Button size="sm" variant="destructive" onClick={() => setOpen(true)}>
                <Trash2 className="h-3.5 w-3.5" />
            </Button>
            <AlertDialog open={open} onOpenChange={(v) => !isPending && setOpen(v)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete post?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete &quot;{title}&quot;. This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleDelete();
                            }}
                            disabled={isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
