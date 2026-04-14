'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { authClient } from '@/lib/auth-client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Mail, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import LogoutButton from './LogoutButton';
import UsernameEditor from './UsernameEditor';

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

type Account = { id: string; providerId: string };

function ProviderIcon({ provider }: { provider: string }) {
    if (provider === 'discord') {
        return (
            <svg
                className="h-4 w-4 shrink-0"
                viewBox="0 0 24 24"
                style={{ fill: '#5865F2' }}
                fillRule="evenodd"
            >
                <path d="M18.942 5.556a16.299 16.299 0 0 0-4.126-1.297c-.178.321-.385.754-.529 1.097a15.175 15.175 0 0 0-4.573 0 11.583 11.583 0 0 0-.535-1.097 16.274 16.274 0 0 0-4.129 1.3c-2.611 3.946-3.319 7.794-2.965 11.587a16.494 16.494 0 0 0 5.061 2.593 12.65 12.65 0 0 0 1.084-1.785 10.689 10.689 0 0 1-1.707-.831c.143-.106.283-.217.418-.331 3.291 1.539 6.866 1.539 10.118 0 .137.114.277.225.418.331-.541.326-1.114.606-1.71.832a12.52 12.52 0 0 0 1.084 1.785 16.46 16.46 0 0 0 5.064-2.595c.415-4.396-.709-8.209-2.973-11.589zM8.678 14.813c-.988 0-1.798-.922-1.798-2.045s.793-2.047 1.798-2.047 1.815.922 1.798 2.047c.001 1.123-.793 2.045-1.798 2.045zm6.644 0c-.988 0-1.798-.922-1.798-2.045s.793-2.047 1.798-2.047 1.815.922 1.798 2.047c0 1.123-.793 2.045-1.798 2.045z" />
            </svg>
        );
    }
    if (provider === 'google') {
        return (
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                />
                <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                />
                <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                />
                <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                />
            </svg>
        );
    }
    return <Mail className="h-4 w-4 shrink-0" />;
}

function providerLabel(providerId: string): string {
    if (providerId === 'credential') return 'Email & Password';
    return providerId.charAt(0).toUpperCase() + providerId.slice(1);
}

export default function AccountTab() {
    const { data: session, isPending } = authClient.useSession();
    const t = useTranslations('profile');

    const [accounts, setAccounts] = useState<Account[] | null>(null);

    useEffect(() => {
        authClient.listAccounts().then(({ data }) => {
            if (data) setAccounts(data as Account[]);
        });
    }, []);

    if (isPending) {
        return (
            <Card>
                <CardContent className="p-6 space-y-6">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-16 w-16 rounded-full shrink-0" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-5 w-36" />
                            <Skeleton className="h-4 w-52" />
                        </div>
                    </div>
                    <Separator />
                    <div className="space-y-3">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!session?.user) return null;

    const user = session.user;
    const currentUsername = (user as { username?: string }).username ?? '';

    return (
        <div className="space-y-4">
            <Card>
                <CardContent className="p-6 space-y-6">
                    {/* Avatar + identity */}
                    <div className="flex items-start gap-4">
                        <Avatar className="h-16 w-16 shrink-0 ring-2 ring-border">
                            <AvatarImage src={user.image || undefined} alt={user.name || ''} />
                            <AvatarFallback className="text-xl font-semibold">
                                {getInitials(user.name || 'User')}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1 pt-0.5">
                            <p className="font-semibold text-base leading-tight truncate">
                                {user.name}
                            </p>
                            <p className="text-xs text-muted-foreground/80 truncate mt-0.5">
                                {user.email}
                            </p>
                            <div className="mt-1">
                                <UsernameEditor currentUsername={currentUsername} />
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Login methods */}
                    <div className="space-y-3">
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            {t('account.loginMethods')}
                        </p>
                        {accounts === null ? (
                            <div className="space-y-2.5">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                        ) : accounts.length > 0 ? (
                            <ul className="space-y-2.5">
                                {accounts.map((account) => (
                                    <li
                                        key={account.id}
                                        className="flex items-center gap-2.5 text-sm text-foreground"
                                    >
                                        <ProviderIcon provider={account.providerId} />
                                        {providerLabel(account.providerId)}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="flex items-center gap-2.5 text-sm text-foreground">
                                <Mail className="h-4 w-4 shrink-0" />
                                Email & Password
                            </div>
                        )}
                    </div>

                    <Separator />

                    {/* Logout */}
                    <div className="flex justify-end">
                        <LogoutButton />
                    </div>
                </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive/30">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium">{t('account.dangerZone')}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {t('account.dangerZoneSecurityHint')}
                                </p>
                            </div>
                        </div>
                        <Button asChild variant="destructive" size="sm" className="shrink-0">
                            <Link href="?tab=security">{t('account.goToSecurity')}</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
