import { getLocale } from 'next-intl/server';
import { getFaqsByCategory } from '@/app/data-access-layer/faq/getFaqsByCategory';
import { MarkdownRenderer } from '@/components/blog/MarkdownRenderer';
import { JsonLd } from '@/components/seo/JsonLd';
import { faqPageJsonLd } from '@/lib/structuredData';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';

type FaqSectionProps = {
    /** FAQ categories to display. An FAQ is shown if it matches any of these. */
    categories: string[];
    /**
     * Optional already-translated heading (e.g. "Frequently Asked Questions")
     * rendered above the list. Omit it to disable the header entirely.
     */
    heading?: string;
    /**
     * Optional entry built by the page (e.g. from live config, so it cannot live in the FAQ
     * table). Shown first and open by default, and included in the FAQPage JSON-LD.
     */
    leadItem?: { question: string; answer: string };
    className?: string;
};

const LEAD_ITEM_VALUE = 'lead';

/**
 * Reusable FAQ block. Pass the categories you want to surface and it fetches the
 * matching, enabled FAQs from the database in the current locale.
 *
 * Also emits FAQPage JSON-LD, so use at most one FaqSection per page (Google expects a
 * single FAQPage per URL).
 *
 * It is an async server component, rendered in place (no <Suspense>: streaming would put the
 * answers in a hidden <div> at the end of the HTML and leave a heading over an empty skeleton
 * when there are no entries). The FAQs are cached, so it does not hold up the page. It can be
 * embedded inside a client component by passing it through as `children`/a prop
 * (e.g. `<SomeClientComponent>{<FaqSection categories={['order']} />}</SomeClientComponent>`),
 * since async server components cannot be imported directly into a client module.
 */
export async function FaqSection({ categories, heading, leadItem, className }: FaqSectionProps) {
    const locale = await getLocale();
    const dbFaqs = await getFaqsByCategory(categories, locale);
    const faqs = [
        ...(leadItem ? [{ ...leadItem, value: LEAD_ITEM_VALUE }] : []),
        ...dbFaqs.map((faq) => ({ ...faq, value: String(faq.id) })),
    ];

    if (faqs.length === 0) return null;

    return (
        <div className={className}>
            {heading && (
                <h2 className="mb-4 text-lg font-semibold tracking-tight text-foreground md:text-xl">
                    {heading}
                </h2>
            )}
            <Accordion
                type="single"
                collapsible
                defaultValue={leadItem ? LEAD_ITEM_VALUE : undefined}
                className="space-y-1"
            >
                {faqs.map((faq) => (
                    <AccordionItem key={faq.value} value={faq.value}>
                        <AccordionTrigger className="text-left text-sm font-medium">
                            {faq.question}
                        </AccordionTrigger>
                        {/* forceMount: Radix otherwise leaves closed answers out of the HTML,
                            so crawlers would only see the questions */}
                        <AccordionContent forceMount>
                            <MarkdownRenderer content={faq.answer} />
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
            <JsonLd data={faqPageJsonLd(faqs)} />
        </div>
    );
}
