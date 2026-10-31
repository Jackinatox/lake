import { SITE_NAME, SITE_URL } from '@/lib/metadata';
import { stripMarkdown } from '@/lib/markdownExcerpt';

// schema.org JSON-LD for Google rich results, rendered with components/seo/JsonLd.tsx.
// Only describe what is also visible on the page; Google penalizes markup that is not.

const LOGO_URL = `${SITE_URL}/logo/ScyedLogoBlack.webp`;

function publisher() {
    return {
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL,
        logo: LOGO_URL,
    };
}

/** Organization + WebSite for the homepage: brand name, logo and contact in search results. */
export function homeJsonLd(locale: string) {
    return [
        {
            '@context': 'https://schema.org',
            ...publisher(),
            email: 'info@scyed.com',
        },
        {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: SITE_NAME,
            url: `${SITE_URL}/${locale}`,
            inLanguage: locale,
            publisher: publisher(),
        },
    ];
}

/** FAQPage for an FAQ block; answers are markdown in the DB, the markup gets plain text. */
export function faqPageJsonLd(faqs: { question: string; answer: string }[]) {
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: { '@type': 'Answer', text: stripMarkdown(faq.answer) },
        })),
    };
}

export function blogPostingJsonLd({
    locale,
    slug,
    title,
    description,
    publishedAt,
    updatedAt,
}: {
    locale: string;
    slug: string;
    title: string;
    description: string;
    publishedAt: Date;
    updatedAt: Date;
}) {
    const url = `${SITE_URL}/${locale}/blog/${slug}`;
    return {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: title,
        description,
        url,
        mainEntityOfPage: url,
        datePublished: publishedAt.toISOString(),
        dateModified: updatedAt.toISOString(),
        author: publisher(),
        publisher: publisher(),
    };
}
