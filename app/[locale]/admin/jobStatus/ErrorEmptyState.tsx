export function ErrorEmptyState() {
    return (
        <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                <svg
                    className="w-6 h-6 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                    />
                </svg>
            </div>
            <p className="text-sm text-muted-foreground">No errors logged in the last 24 hours</p>
            <p className="text-xs text-muted-foreground mt-1">All systems running smoothly! 🎉</p>
        </div>
    );
}
