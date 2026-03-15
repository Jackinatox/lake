'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function MarkdownRenderer({ content }: { content: string }) {
    return (
        <div className="prose prose-neutral dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
    );
}
