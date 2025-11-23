// app/layout.tsx
import { auth } from '@/auth';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { Toaster } from '@/components/ui/toaster';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale } from 'next-intl/server';
import { PublicEnvScript, env } from 'next-runtime-env';
import { ThemeProvider } from 'next-themes';
import { Geist } from 'next/font/google';
import { headers } from 'next/headers';
import './globals.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
    metadataBase: new URL(env("NEXT_PUBLIC_APP_URL")!),
    title: 'Scyed Hosting',
    description: 'A little above average Gameserver hosting platform',
    robots: {
        index: false,
        follow: false,
    },
};

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
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    return (
        <html lang={locale} className={geistSans.className} suppressHydrationWarning>
            <head>
                <PublicEnvScript />
            </head>
            <NextIntlClientProvider>
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
                                {/* {env('NODE_ENV') !== 'production' && (
                                    <pre className="break-words whitespace-pre-wrap bg-muted p-4 rounded text-xs ">
                                        {JSON.stringify(session?.user, null, 2)}
                                    </pre>
                                )} */}
                            </div>
                            <Footer />
                        </main>
                    </ThemeProvider>
                </body>
            </NextIntlClientProvider>
        </html>
    );
}
