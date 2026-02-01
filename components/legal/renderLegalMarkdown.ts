import 'server-only';

export function renderToHtml(markdownContent: string): string {
    return Bun.markdown.html(markdownContent);
}
