/**
 * Euro amounts as the locale writes the number ("0,40" in German, "0.40" in English), always with
 * two decimals. The € sign goes after the number in every locale, so unit strings like
 * "€/vCore/Mon." from the messages can follow it directly.
 *
 * Client components use `useFormatEuro()` (hooks/useFormatEuro.ts), which fills in the locale.
 */
export function formatEuroNumber(cents: number, locale: string): string {
    return new Intl.NumberFormat(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(cents / 100);
}

/** `formatEuroNumber` plus " €": "0,40 €" / "0.40 €". */
export function formatEuro(cents: number, locale: string): string {
    return `${formatEuroNumber(cents, locale)} €`;
}
