'use client';

import { useEffect, useSyncExternalStore, useState } from 'react';
import { useTranslations } from 'next-intl';
import posthog from 'posthog-js';
import { Cookie } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';

const CONSENT_KEY = 'lake_cookie_consent';

function emitStorageEvent(key: string, value: string) {
    window.dispatchEvent(new StorageEvent('storage', { key, newValue: value }));
}

function subscribe(callback: () => void) {
    window.addEventListener('storage', callback);
    return () => window.removeEventListener('storage', callback);
}

function getSnapshot() {
    return localStorage.getItem(CONSENT_KEY);
}

function getServerSnapshot(): string | null {
    return null;
}

function CookieBanner() {
    const consent = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
    const t = useTranslations('CookieBanner');
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        setHydrated(true);
    }, []);

    useEffect(() => {
        if (consent === 'accepted') {
            posthog.opt_in_capturing();
        } else if (consent === 'declined') {
            posthog.opt_out_capturing();
        }
    }, [consent]);

    const handleAccept = () => {
        localStorage.setItem(CONSENT_KEY, 'accepted');
        emitStorageEvent(CONSENT_KEY, 'accepted');
    };

    const handleDecline = () => {
        localStorage.setItem(CONSENT_KEY, 'declined');
        emitStorageEvent(CONSENT_KEY, 'declined');
    };

    if (!hydrated || consent !== null) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 flex justify-center pointer-events-none">
            <div className="pointer-events-auto w-full max-w-2xl border bg-background/95 backdrop-blur-sm rounded-xl shadow-2xl p-4 md:p-6 flex flex-col gap-4">
                <div className="flex items-start gap-3">
                    <Cookie className="h-5 w-5 mt-0.5 shrink-0 text-muted-foreground" />
                    <div className="flex flex-col gap-1">
                        <p className="font-semibold text-sm">{t('title')}</p>
                        <p className="text-sm text-muted-foreground">{t('description')}</p>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                    <Link
                        href="/legal/privacy"
                        className="text-xs text-muted-foreground hover:underline text-center sm:mr-auto self-center"
                    >
                        {t('privacyPolicy')}
                    </Link>
                    <Button size="sm" variant="outline" onClick={handleDecline}>
                        {t('decline')}
                    </Button>
                    <Button size="sm" onClick={handleAccept}>
                        {t('accept')}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default CookieBanner;
