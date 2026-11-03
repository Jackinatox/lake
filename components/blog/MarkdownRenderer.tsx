'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SITE_URL } from '@/lib/metadata';

const LAKE_HOSTS = new Set(['scyed.com', URL.canParse(SITE_URL) ? new URL(SITE_URL).host : '']);

/**
 * Links in FAQ answers and blog posts open in a new tab, except lake-internal ones: relative
 * paths or lake's own domain, but not /docs (a separate site). Anchors and mailto/tel stay as is.
 */
function opensInNewTab(href: string | undefined): boolean {
    if (!href || href.startsWith('#') || /^(mailto|tel):/i.test(href)) return false;
    if (!URL.canParse(href, 'https://scyed.com')) return false;

    const url = new URL(href, 'https://scyed.com');
    return !LAKE_HOSTS.has(url.host) || /^\/docs(\/|$)/.test(url.pathname);
}

export function MarkdownRenderer({ content }: { content: string }) {
    return (
        <div className="prose prose-neutral dark:prose-invert max-w-none">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    a: ({ node: _node, href, ...props }) =>
                        opensInNewTab(href) ? (
                            <a href={href} target="_blank" rel="noopener" {...props} />
                        ) : (
                            <a href={href} {...props} />
                        ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
