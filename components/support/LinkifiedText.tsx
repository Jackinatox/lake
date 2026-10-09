const URL_PATTERN = /(https?:\/\/[^\s<>"']+[^\s<>"'.,;:!?)\]])/g;

/**
 * Renders ticket text as plain text (whitespace preserved) with http(s) URLs turned into links.
 * Messages are never interpreted as HTML or markdown.
 */
export default function LinkifiedText({ text }: { text: string }) {
    const parts = text.split(URL_PATTERN);
    return (
        <>
            {parts.map((part, i) =>
                // `split` with a capture group puts the matches at the odd indices.
                i % 2 === 1 ? (
                    <a
                        key={i}
                        href={part}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="break-all underline underline-offset-2"
                    >
                        {part}
                    </a>
                ) : (
                    part
                ),
            )}
        </>
    );
}
