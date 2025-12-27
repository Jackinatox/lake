import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { Toaster } from '@/components/ui/toaster';
import { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale } from 'next-intl/server';
import { PublicEnvScript, env } from 'next-runtime-env';
import { ThemeProvider } from 'next-themes';
import { Geist } from 'next/font/google';
import './globals.css';
import DevSessionInfo from '@/components/auth/DevSessionInfo';

export async function generateMetadata(): Promise<Metadata> {
    const appUrl = env('NEXT_PUBLIC_APP_URL');
    return {
        metadataBase: appUrl ? new URL(appUrl) : undefined,
        title: 'Scyed Hosting',
        description: 'A little above average Gameserver hosting platform',
        robots: {
            index: false,
            follow: false,
        },
    };
}

export const viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

const geistSans = Geist({
    display: 'swap',
    subsets: ['latin'],
});

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const locale = await getLocale();
    const messages = (await import(`../messages/${locale}.json`)).default;

    return (
        <html lang={locale} className={geistSans.className} suppressHydrationWarning>
            <head>
                <PublicEnvScript />
            </head>
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
                                {children}
                                <Toaster />
                                {env('NODE_ENV') !== 'production' && <DevSessionInfo />}
                            </div>
                            <Footer />
                        </main>
                    </ThemeProvider>
                </body>
            </NextIntlClientProvider>
        </html>
    );
}
