import { useLocale } from 'next-intl';
import { formatEuro, formatEuroNumber } from '@/lib/GlobalFunctions/formatEuro';

/** Euro formatting in the current locale, see lib/GlobalFunctions/formatEuro.ts. Takes cents. */
export function useFormatEuro() {
    const locale = useLocale();
    return {
        formatEuro: (cents: number, unit?: string) => formatEuro(cents, locale, unit),
        formatEuroNumber: (cents: number) => formatEuroNumber(cents, locale),
    };
}
