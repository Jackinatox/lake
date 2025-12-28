import { useLocale } from "next-intl";

export function useLakeLocale() {
    const locale = (useLocale() === 'de' ? 'de' : 'en') as 'de' | 'en';
    return locale;
}