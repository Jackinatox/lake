interface ErrorDetailsProps {
    details: any;
}

export function ErrorDetails({ details }: ErrorDetailsProps) {
    if (!details) return null;

    return (
        <details className="text-xs w-full mt-2">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground select-none">
                Details
            </summary>
            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto w-full">
                {JSON.stringify(details, null, 2)}
            </pre>
        </details>
    );
}
