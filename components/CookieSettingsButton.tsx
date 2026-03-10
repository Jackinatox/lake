'use client';

import { useTranslations } from 'next-intl';
import { Cookie } from 'lucide-react';

const CONSENT_KEY = 'lake_cookie_consent';

export default function CookieSettingsButton() {
    const t = useTranslations('CookieBanner');

    const openBanner = () => {
        localStorage.removeItem(CONSENT_KEY);
        window.dispatchEvent(new StorageEvent('storage', { key: CONSENT_KEY, newValue: null }));
    };

    return (
        <button
            onClick={openBanner}
            type='button'
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
            <Cookie className="h-3.5 w-3.5" />
            <span>{t('cookieSettings')}</span>
        </button>
    );
}
