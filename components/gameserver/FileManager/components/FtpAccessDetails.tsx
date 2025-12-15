'use client';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronDown, Copy, KeyRound, Server } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';

interface FtpAccessDetailsProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    host: string;
    port: string;
    username: string;
    onChangePassword: () => void;
    passwordLabel?: string;
    passwordPlaceholder?: string;
    className?: string;
}

export function FtpAccessDetails({
    passwordLabel = 'Password',
    passwordPlaceholder = '••••••••',
    isOpen,
    onOpenChange,
    host,
    port,
    username,
    onChangePassword,
    className,
}: FtpAccessDetailsProps) {
    const { toast } = useToast();
    const t = useTranslations('gameserver.fileManager.ftpAccess');

    const handleCopy = useCallback(
        async (label: string, value: string) => {
            try {
                await navigator.clipboard.writeText(value);
                toast({
                    title: t('copiedToast', { label }),
                    description: value,
                });
            } catch (error) {
                console.error('Failed to copy', error);
                toast({
                    title: t('copyFailedToast', { label: label.toLowerCase() }),
                    description: t('copyFailedDescription'),
                    variant: 'destructive',
                });
            }
        },
        [toast, t],
    );

    const renderCopyBox = (label: string, value: string) => (
        <button
            key={label}
            type="button"
            className="w-full rounded border bg-background px-3 py-2 text-left text-sm transition hover:bg-muted"
            onClick={() => handleCopy(label, value)}
        >
            <p className="flex items-center justify-between text-xs uppercase text-muted-foreground">
                <span>{label}</span>
                <Copy className="h-3.5 w-3.5" />
            </p>
            <p className="mt-1 flex items-center justify-between font-mono text-sm">
                <span className="truncate" title={value}>
                    {value}
                </span>
            </p>
        </button>
    );

    return (
        <Collapsible open={isOpen} onOpenChange={onOpenChange}>
            <div className={cn('rounded-md border bg-muted/40', className)}>
                <CollapsibleTrigger asChild>
                    <button
                        type="button"
                        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium"
                    >
                        <span className="flex items-center gap-2">
                            <Server className="h-4 w-4" />
                            {t('title')}
                        </span>
                        <ChevronDown
                            className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        />
                    </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="px-4 pb-4 pt-1">
                    <div className="grid gap-3 sm:grid-cols-2">
                        {renderCopyBox(t('host'), `${host}:${port}`)}
                        {renderCopyBox(t('username'), username)}
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3">
                        <p className="text-xs text-muted-foreground">
                            {t('description')}
                        </p>
                        <Button size="sm" onClick={onChangePassword}>
                            <KeyRound className="mr-2 h-4 w-4" />
                            {t('changePasswordButton')}
                        </Button>
                    </div>
                </CollapsibleContent>
            </div>
        </Collapsible>
    );
}
