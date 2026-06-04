import { Suspense } from 'react';
import { getLocale } from 'next-intl/server';
import { getFaqsByCategory } from '@/app/data-access-layer/faq/getFaqsByCategory';
import { MarkdownRenderer } from '@/components/blog/MarkdownRenderer';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';

type FaqSectionProps = {
    /** FAQ categories to display. An FAQ is shown if it matches any of these. */
    categories: string[];
    className?: string;
};

/**
 * Reusable FAQ block. Pass the categories you want to surface and it fetches the
 * matching, enabled FAQs from the database in the current locale.
 *
 * It is a server component that streams in via <Suspense>, so it can also be
 * embedded inside a client component by passing it through as `children`/a prop
 * (e.g. `<SomeClientComponent>{<FaqSection categories={['order']} />}</SomeClientComponent>`),
 * since async server components cannot be imported directly into a client module.
 */
export function FaqSection({ categories, className }: FaqSectionProps) {
    return (
        <Suspense fallback={<FaqSkeleton />}>
            <FaqList categories={categories} className={className} />
        </Suspense>
    );
}

async function FaqList({ categories, className }: FaqSectionProps) {
    const locale = await getLocale();
    const faqs = await getFaqsByCategory(categories, locale);

    if (faqs.length === 0) return null;

    return (
        <Accordion type="single" collapsible className={className}>
            {faqs.map((faq) => (
                <AccordionItem key={faq.id} value={String(faq.id)}>
                    <AccordionTrigger className="text-left text-sm font-medium">
                        {faq.question}
                    </AccordionTrigger>
                    <AccordionContent>
                        <MarkdownRenderer content={faq.answer} />
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    );
}

function FaqSkeleton() {
    return (
        <div className="space-y-3" aria-hidden>
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="border-b pb-4 pt-4">
                    <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                </div>
            ))}
        </div>
    );
}
