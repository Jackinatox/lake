import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import CookieBanner from '@/components/CookieBanner';
import { Toaster } from '@/components/ui/toaster';
import { Metadata } from 'next';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { ThemeProvider } from 'next-themes';
import { Geist, Inter } from 'next/font/google';
import '../globals.css';
import DevSessionInfo from '@/components/auth/DevSessionInfo';
import MaintenanceBanner from '@/components/MaintenanceBanner';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export async function generateMetadata(): Promise<Metadata> {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    return {
        metadataBase: appUrl ? new URL(appUrl) : undefined,
        applicationName: 'Scyed Hosting',
        title: {
            default: 'Scyed Hosting',
            template: '%s | Scyed Hosting',
        },
        description: 'A little above average Gameserver hosting platform',
    };
}

// No maximumScale/userScalable: blocking zoom fails accessibility (WCAG 1.4.4) and Lighthouse.
// iOS auto-zooms into inputs below 16px, so inputs use text-base on mobile instead.
export const viewport = {
    width: 'device-width',
    initialScale: 1,
};

const geistSans = Geist({
    display: 'swap',
    subsets: ['latin'],
});

// The root layout lives inside `[locale]` so it re-renders when the locale changes. A layout
// above the segment stays mounted across client navigations, so a language switch would leave the
// provider's messages, the navbar, the footer and `<html lang>` in the old language.
export default async function RootLayout({
    children,
    params,
}: Readonly<{
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}>) {
    const { locale } = await params;
    if (!hasLocale(routing.locales, locale)) notFound();
    setRequestLocale(locale);
    const messages = await getMessages();

    return (
        <html
            lang={locale}
            className={cn(geistSans.className, 'font-sans', inter.variable)}
            suppressHydrationWarning
        >
            <NextIntlClientProvider locale={locale} messages={messages}>
                <body className="bg-background text-foreground flex flex-col min-h-screen">
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="system"
                        enableSystem
                        disableTransitionOnChange
                    >
                        <main className="flex flex-col flex-1">
                            <Navbar locale={locale} />
                            <div className="flex flex-col gap-10 w-full max-w-8xl mx-auto px-2 md:px-8 p-2 md:py-4 flex-1">
                                <MaintenanceBanner />
                                {children}
                                <Toaster />
                                {process.env.NODE_ENV !== 'production' && <DevSessionInfo />}
                            </div>
                            <Footer />
                        </main>
                        <CookieBanner />
                    </ThemeProvider>
                </body>
            </NextIntlClientProvider>
        </html>
    );
}
