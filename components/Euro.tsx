import { useLocale } from 'next-intl';
import { formatEuro } from '@/lib/GlobalFunctions/formatEuro';
import { cn } from '@/lib/utils';

/**
 * A euro amount in the UI: the text of `formatEuro` ("0,40 €" with a no-break space), kept on one
 * line, and the space narrowed to about a thin space by the `euro` utility (app/globals.css).
 * Copying, search and crawlers still get the real space. Works in server and client components.
 */
export function Euro({
    cents,
    unit,
    locale,
    className,
}: {
    cents: number;
    /** Per-unit price label starting with €, e.g. "€/vCore/Mon." */
    unit?: string;
    /** Number format of this locale instead of the page's, e.g. 'de' in German-only text */
    locale?: string;
    className?: string;
}) {
    const pageLocale = useLocale();
    return (
        <span className={cn('euro', className)}>
            {formatEuro(cents, locale ?? pageLocale, unit)}
        </span>
    );
}
