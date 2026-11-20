'use client';

import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

const linkClass = 'underline underline-offset-2 hover:text-foreground';

/**
 * Notice right at the create / extend button that the click accepts the free server
 * terms of use and the AGB (no checkbox, see docs/free-server-terms.md). Links open in
 * a new tab so the form state on the current page is kept.
 */
export default function FreeTermsNotice({
    action,
    className,
}: {
    action: 'create' | 'extend';
    className?: string;
}) {
    const t = useTranslations('freeServer.termsNotice');

    return (
        <p className={cn('text-sm text-muted-foreground leading-snug', className)}>
            {t.rich(action, {
                terms: (chunks) => (
                    <Link href="/legal/free-terms" target="_blank" className={linkClass}>
                        {chunks}
                    </Link>
                ),
                tos: (chunks) => (
                    <Link href="/legal/tos" target="_blank" className={linkClass}>
                        {chunks}
                    </Link>
                ),
            })}
        </p>
    );
}
