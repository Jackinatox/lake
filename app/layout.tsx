// app/layout.tsx
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Geist } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import './globals.css';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale } from 'next-intl/server';
import { Toaster } from '@/components/ui/toaster';
import { auth } from '@/auth';
import { headers } from 'next/headers';
import { PublicEnvScript, env } from 'next-runtime-env';

const defaultUrl = env('VERCEL_URL') ? `https://${env('VERCEL_URL')}` : 'http://localhost:3000';

export const metadata = {
    metadataBase: new URL(defaultUrl),
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
