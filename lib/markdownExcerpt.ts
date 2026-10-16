/** Plain text of a markdown string, for excerpts and meta descriptions. */
export function stripMarkdown(md: string): string {
    return (
        md
            // Images before links, otherwise `![alt](src)` is read as a link and leaves `!alt`.
            .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            // Block markers only at the start of a line, so a ` - ` or `C# ` inside a sentence
            // survives. Before emphasis, otherwise two `* item` bullets are read as italics.
            .replace(/^\s*#{1,6}\s+/gm, '')
            .replace(/^\s*>\s?/gm, '')
            .replace(/^\s*(?:[-*+]|\d+\.)\s+/gm, '')
            .replace(/\*\*([^*]+)\*\*/g, '$1')
            .replace(/\*([^*]+)\*/g, '$1')
            .replace(/`([^`]+)`/g, '$1')
            .replace(/\n/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
    );
}

/** Plain-text excerpt cut at a word boundary, sized for a meta description (~155 chars). */
export function markdownExcerpt(md: string, maxLength = 155): string {
    const text = stripMarkdown(md);
    if (text.length <= maxLength) return text;
    const cut = text.slice(0, maxLength);
    const lastSpace = cut.lastIndexOf(' ');
    return `${(lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s.,;:!?-]+$/, '')}…`;
}
