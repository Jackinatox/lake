'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { authClient } from '@/lib/auth-client';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
import { Monitor, Smartphone, Globe, Loader2, X, LogOut } from 'lucide-react';

type SessionObj = {
    id: string;
    token: string;
    userId: string;
    userAgent?: string | null;
    ipAddress?: string | null;
    createdAt: string | Date;
    expiresAt: string | Date;
};

function parseUserAgent(ua: string | null | undefined): {
    browser: string;
    os: string;
    isMobile: boolean;
} {
    if (!ua) return { browser: 'Unknown Browser', os: 'Unknown OS', isMobile: false };

    let browser = 'Unknown Browser';
    if (/Edg\//.test(ua)) browser = 'Edge';
    else if (/OPR\//.test(ua)) browser = 'Opera';
    else if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) browser = 'Chrome';
    else if (/Firefox\//.test(ua)) browser = 'Firefox';
    else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) browser = 'Safari';

    let os = 'Unknown OS';
    const isMobile = /iPhone|iPad|Android/.test(ua);
    if (/iPhone|iPad/.test(ua)) os = 'iOS';
    else if (/Android/.test(ua)) os = 'Android';
    else if (/Windows NT/.test(ua)) os = 'Windows';
    else if (/Mac OS X/.test(ua)) os = 'macOS';
    else if (/Linux/.test(ua)) os = 'Linux';

    return { browser, os, isMobile };
}

function formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export default function SessionManager() {
    const { data: session } = authClient.useSession();
    const t = useTranslations('profile');

    const [sessions, setSessions] = useState<SessionObj[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [revokeTarget, setRevokeTarget] = useState<SessionObj | null>(null);
    const [showRevokeAll, setShowRevokeAll] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const currentToken = session?.session?.token;

    const loadSessions = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await authClient.listSessions();
            if (result?.data) {
                setSessions(result.data as SessionObj[]);
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSessions();
    }, [loadSessions]);

    const handleRevoke = async () => {
        if (!revokeTarget) return;
        setActionLoading(true);
        try {
            await authClient.revokeSession({ token: revokeTarget.token });
            setSessions((prev) => prev.filter((s) => s.token !== revokeTarget.token));
        } finally {
            setActionLoading(false);
            setRevokeTarget(null);
        }
    };

    const handleRevokeAll = async () => {
        setActionLoading(true);
        try {
            await authClient.revokeOtherSessions();
            setSessions((prev) => prev.filter((s) => s.token === currentToken));
        } finally {
            setActionLoading(false);
            setShowRevokeAll(false);
        }
    };

    const otherSessions = sessions.filter((s) => s.token !== currentToken);
    const currentSession = sessions.find((s) => s.token === currentToken);

    return (
        <>
            <Card>
                <CardHeader className="gap-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1">
                            <CardTitle>{t('sessions.title')}</CardTitle>
                            <CardDescription>{t('sessions.description')}</CardDescription>
                        </div>
                        {otherSessions.length > 0 && !isLoading && (
                            <Button
                                variant="destructive"
                                size="sm"
                                className="w-full sm:w-auto sm:shrink-0"
                                onClick={() => setShowRevokeAll(true)}
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                {t('sessions.revokeAllButton')}
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    {isLoading ? (
                        <div className="space-y-3">
                            {/* Current session skeleton */}
                            <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                                <div className="mt-0.5 h-5 w-5 shrink-0 rounded bg-muted animate-pulse" />
                                <div className="space-y-2 flex-1">
                                    <div className="h-4 w-36 rounded bg-muted animate-pulse" />
                                    <div className="h-3 w-56 rounded bg-muted animate-pulse" />
                                </div>
                            </div>
                            <Separator />
                            {/* Other session skeletons */}
                            {[0, 1].map((i) => (
                                <div
                                    key={i}
                                    className="flex items-start justify-between gap-3 rounded-lg border p-3"
                                >
                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                        <div className="mt-0.5 h-5 w-5 shrink-0 rounded bg-muted animate-pulse" />
                                        <div className="space-y-2 flex-1">
                                            <div className="h-4 w-44 rounded bg-muted animate-pulse" />
                                            <div className="h-3 w-64 rounded bg-muted animate-pulse" />
                                        </div>
                                    </div>
                                    <div className="h-7 w-7 shrink-0 rounded bg-muted animate-pulse" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <>
                            {/* Current session */}
                            {currentSession && (
                                <SessionCard
                                    s={currentSession}
                                    isCurrent
                                    currentLabel={t('sessions.currentSession')}
                                    signedInLabel={t('sessions.signedIn')}
                                    expiresLabel={t('sessions.expires')}
                                    unknownDevice={t('sessions.unknownDevice')}
                                />
                            )}

                            {otherSessions.length > 0 && currentSession && <Separator />}

                            {/* Other sessions */}
                            {otherSessions.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-2">
                                    {t('sessions.noOtherSessions')}
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {otherSessions.map((s) => (
                                        <SessionCard
                                            key={s.id}
                                            s={s}
                                            isCurrent={false}
                                            currentLabel={t('sessions.currentSession')}
                                            signedInLabel={t('sessions.signedIn')}
                                            expiresLabel={t('sessions.expires')}
                                            unknownDevice={t('sessions.unknownDevice')}
                                            revokeLabel={t('sessions.revokeButton')}
                                            onRevoke={() => setRevokeTarget(s)}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Revoke single session dialog */}
            <AlertDialog
                open={!!revokeTarget}
                onOpenChange={(open) => !open && setRevokeTarget(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('sessions.revokeConfirmTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('sessions.revokeConfirmDescription')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('sessions.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleRevoke}
                            disabled={actionLoading}
                            className={buttonVariants({ variant: 'destructive' })}
                        >
                            {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {t('sessions.confirm')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Revoke all sessions dialog */}
            <AlertDialog open={showRevokeAll} onOpenChange={setShowRevokeAll}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('sessions.revokeAllConfirmTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('sessions.revokeAllConfirmDescription')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('sessions.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleRevokeAll}
                            disabled={actionLoading}
                            className={buttonVariants({ variant: 'destructive' })}
                        >
                            {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {t('sessions.confirm')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

function SessionCard({
    s,
    isCurrent,
    currentLabel,
    signedInLabel,
    expiresLabel,
    unknownDevice,
    revokeLabel,
    onRevoke,
}: {
    s: SessionObj;
    isCurrent: boolean;
    currentLabel: string;
    signedInLabel: string;
    expiresLabel: string;
    unknownDevice: string;
    revokeLabel?: string;
    onRevoke?: () => void;
}) {
    const { browser, os, isMobile } = parseUserAgent(s.userAgent);
    const maskedIp = s.ipAddress ?? '';
    const DeviceIcon = isMobile ? Smartphone : Monitor;

    return (
        <div
            className={`flex items-start justify-between gap-3 rounded-lg p-3 ${isCurrent ? 'bg-muted/50' : 'border'}`}
        >
            <div className="flex items-start gap-3 min-w-0">
                <DeviceIcon className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">
                            {browser !== 'Unknown Browser' ? `${browser} on ${os}` : unknownDevice}
                        </span>
                        {isCurrent && (
                            <span className="text-xs font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                {currentLabel}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        {maskedIp && (
                            <span className="flex items-center gap-1">
                                <Globe className="h-3 w-3" />
                                {maskedIp}
                            </span>
                        )}
                        <span>
                            {signedInLabel}: {formatDate(s.createdAt)}
                        </span>
                        <span>
                            {expiresLabel}: {formatDate(s.expiresAt)}
                        </span>
                    </div>
                </div>
            </div>
            {!isCurrent && onRevoke && revokeLabel && (
                <Button
                    variant="destructive"
                    size="icon"
                    className="shrink-0 h-7 w-7 self-center"
                    onClick={onRevoke}
                    title={revokeLabel}
                >
                    <X className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
}
