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
import { FAQ } from '@/app/client/generated/browser';
import deleteFAQ from './deleteFaq';

/** Delete button with a confirmation dialog; used in the table row and in the edit dialog. */
export default function DeleteFAQButton({
    faq,
    showLabel = false,
    onDeleted,
}: {
    faq: FAQ;
    showLabel?: boolean;
    /** Called after the entry is gone, e.g. to close the edit dialog */
    onDeleted?: () => void;
}) {
    const router = useRouter();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    function handleDelete() {
        startTransition(async () => {
            try {
                await deleteFAQ(faq.id);
                setOpen(false);
                onDeleted?.();
                router.refresh();
                toast({ title: 'Deleted', description: `FAQ #${faq.id} removed.` });
            } catch (err) {
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
                {showLabel && <span className="ml-1.5">Delete</span>}
            </Button>

            <AlertDialog open={open} onOpenChange={(v) => !isPending && setOpen(v)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete FAQ #{faq.id}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This permanently deletes{' '}
                            <span className="font-semibold">{faq.question_de}</span> in both
                            languages. To only hide it, switch off &quot;Enabled&quot; instead.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
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
