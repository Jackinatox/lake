/**
 * Euro amounts as the locale writes the number ("0,40" in German, "0.40" in English), always with
 * two decimals. The € sign goes after the number in every locale, separated by a no-break space
 * (U+00A0, as DIN 5008 asks for), so the € never wraps onto a line of its own.
 *
 * In the UI use `<Euro>` (components/Euro.tsx), which also narrows that space. Plain-text places
 * (emails, metadata, toasts, translation values, string props) use `formatEuro`; client
 * components get it with the locale filled in from `useFormatEuro()` (hooks/useFormatEuro.ts).
 */
export function formatEuroNumber(cents: number, locale: string): string {
    return new Intl.NumberFormat(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(cents / 100);
}

/**
 * "0,40 €" / "0.40 €". `unit` replaces the plain € for per-unit prices and must start with it,
 * e.g. "€/vCore/Mon." from the messages.
 */
export function formatEuro(cents: number, locale: string, unit = '€'): string {
    return `${formatEuroNumber(cents, locale)} ${unit}`;
}
