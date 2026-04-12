'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { authClient } from '@/lib/auth-client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
import { Mail, Lock, LogOut, AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import LogoutButton from './LogoutButton';

function getInitials(name: string): string {
    return (
        name
            .split(' ')
            .map((p) => p[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || 'U'
    );
}

export default function AccountTab() {
    const { data: session, isPending } = authClient.useSession();
    const tp = useTranslations('payments');
    const t = useTranslations('profile');

    const [showSignOutAll, setShowSignOutAll] = useState(false);
    const [signOutLoading, setSignOutLoading] = useState(false);

    if (isPending) {
        return (
            <div className="space-y-4">
                <Card>
                    <CardContent className="pt-6 space-y-4">
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-16 w-16 rounded-full" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-48" />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Skeleton className="h-8 w-32" />
                            <Skeleton className="h-8 w-20" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!session?.user) return null;

    const user = session.user;
    const method = authClient.getLastUsedLoginMethod();
    const wasEmail = authClient.isLastUsedLoginMethod('email');

    const methodLabel = method ? method.charAt(0).toUpperCase() + method.slice(1) : 'Unknown';

    const handleSignOutAll = async () => {
        setSignOutLoading(true);
        try {
            await authClient.revokeOtherSessions();
        } finally {
            setSignOutLoading(false);
            setShowSignOutAll(false);
        }
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>{tp('profileTitle')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                    {/* Avatar + info */}
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16 shrink-0">
                            <AvatarImage src={user.image || undefined} alt={user.name || ''} />
                            <AvatarFallback className="text-lg font-semibold">
                                {getInitials(user.name || 'User')}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1 space-y-1.5">
                            <span className="font-semibold leading-none truncate block">
                                {user.name}
                            </span>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">{user.email}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">via {methodLabel}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                        {wasEmail ? (
                            <Button asChild variant="outline" size="sm">
                                <Link href="/profile/change-password">
                                    <Lock className="h-4 w-4 mr-2" />
                                    {tp('changePassword')}
                                </Link>
                            </Button>
                        ) : (
                            <Button variant="outline" size="sm" disabled>
                                <Lock className="h-4 w-4 mr-2" />
                                {tp('changePassword')}
                            </Button>
                        )}
                        <LogoutButton />
                    </div>

                    {!wasEmail && (
                        <p className="text-xs text-muted-foreground">
                            {tp('oauthPasswordChangeNotice1')}{' '}
                            <span className="font-medium">{methodLabel}</span>
                            {tp('oauthPasswordChangeNotice2')}
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive/30">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        {t('account.dangerZone')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="space-y-0.5">
                            <p className="text-sm font-medium">{t('account.signOutAllSessions')}</p>
                            <p className="text-xs text-muted-foreground">
                                {t('account.signOutAllSessionsDescription')}
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="shrink-0 border-destructive/40 text-destructive hover:bg-destructive/10"
                            onClick={() => setShowSignOutAll(true)}
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            {t('account.signOutAllSessions')}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={showSignOutAll} onOpenChange={setShowSignOutAll}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('account.signOutAllConfirmTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('account.signOutAllConfirmDescription')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('account.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleSignOutAll}
                            disabled={signOutLoading}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {signOutLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {t('account.confirm')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
