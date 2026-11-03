/**
 * Renders schema.org structured data. `<` is escaped so content can never close the script tag.
 * Several entities get one script tag each: a top-level JSON array is valid JSON-LD, but many
 * consumers read `data['@context']` straight off the parsed value and break on an array.
 */
export function JsonLd({ data }: { data: object | object[] }) {
    const entities = Array.isArray(data) ? data : [data];

    return (
        <>
            {entities.map((entity, i) => (
                <script
                    key={i}
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(entity).replace(/</g, '\\u003c'),
                    }}
                />
            ))}
        </>
    );
}
