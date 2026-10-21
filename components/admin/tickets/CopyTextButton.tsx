'use client';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ClipboardCopyIcon } from 'lucide-react';

export default function CopyTextButton({ text, label }: { text: string; label: string }) {
    const { toast } = useToast();

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            toast({ title: `${label} copied`, description: text });
        } catch {
            toast({ title: 'Copy failed', variant: 'destructive' });
        }
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            title={`Copy ${label.toLowerCase()}`}
            onClick={copy}
        >
            <ClipboardCopyIcon className="h-3.5 w-3.5" />
        </Button>
    );
}
