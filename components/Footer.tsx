import { ThemeSwitcher } from '@/components/Menu/theme-switcher';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

export default function Footer() {
    const t = useTranslations('footer');

    return (
        <footer className="w-full border-t mt-auto bg-background">
            <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
                {/* Main content grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-12">
                    {/* Support */}
                    <div className="flex flex-col gap-4">
                        <h3 className="font-semibold text-base">Support</h3>
                        <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
                            <Link
                                href="/support"
                                className="hover:text-foreground transition-colors"
                            >
                                {t('contact')}
                            </Link>
                            <Link
                                href="/support"
                                className="hover:text-foreground transition-colors"
                            >
                                {t('faq')}
                            </Link>
                            <Link
                                href="/support"
                                className="hover:text-foreground transition-colors"
                            >
                                {t('documentation')}
                            </Link>
                        </nav>
                    </div>

                    {/* Rechtliches */}
                    <div className="flex flex-col gap-4">
                        <h3 className="font-semibold text-base">Rechtliches</h3>
                        <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
                            <Link
                                href="/legal/impressum"
                                className="hover:text-foreground transition-colors"
                            >
                                {t('impressum')}
                            </Link>
                            <Link
                                href="/legal/agb"
                                className="hover:text-foreground transition-colors"
                            >
                                {t('agb')}
                            </Link>
                            <Link
                                href="/legal/datenschutz"
                                className="hover:text-foreground transition-colors"
                            >
                                {t('datenschutz')}
                            </Link>
                        </nav>
                    </div>

                    {/* Unternehmen (Scyed) */}
                    <div className="flex flex-col gap-4">
                        <h3 className="font-semibold text-base">{t('company')}</h3>
                        <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
                            <Link href="/" className="hover:text-foreground transition-colors">
                                {t('about')}
                            </Link>
                            {/* <Link href="/" className="hover:text-foreground transition-colors">
                                {t('blog')}
                            </Link> */}
                            <a
                                href="https://scyed.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-foreground transition-colors"
                            >
                                Scyed.com
                            </a>
                        </nav>
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t my-8"></div>

                {/* Bottom section with logo and theme switcher */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/"
                            className="mr-4 flex items-center"
                            style={{ height: '100%' }}
                        >
                            <Image
                                src="/images/light/logo/ScyedLogo.webp"
                                alt="Scyed"
                                fill={false}
                                width={1084}
                                height={482}
                                sizes="64px"
                                style={{ width: 'auto', maxHeight: '100%' }}
                                className="block dark:hidden"
                                priority
                            />
                            <Image
                                src="/images/dark/logo/ScyedLogo.webp"
                                alt="Scyed"
                                fill={false}
                                width={1084}
                                height={482}
                                sizes="64px"
                                style={{ width: 'auto', maxHeight: '100%' }}
                                className="hidden dark:block"
                                priority
                            />
                        </Link>
                        <span className="text-sm text-muted-foreground">
                            © 2025 Scyed. All rights reserved.
                        </span>
                    </div>
                    <ThemeSwitcher />
                </div>
            </div>
        </footer>
    );
}
