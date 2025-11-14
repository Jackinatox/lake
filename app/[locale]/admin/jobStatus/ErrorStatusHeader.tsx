interface ErrorStatusHeaderProps {
    errorCount: number;
}

export function ErrorStatusHeader({ errorCount }: ErrorStatusHeaderProps) {
    return (
        <div className="flex items-center justify-between mb-3 md:mb-4">
            <h2 className="text-lg font-semibold text-card-foreground">Recent Errors</h2>
            <div className="flex items-center gap-2">
                <div
                    className={`w-2 h-2 rounded-full ${errorCount > 0 ? 'bg-red-500' : 'bg-green-500'}`}
                />
                <span className="text-sm font-medium">{errorCount} errors in last 24h</span>
            </div>
        </div>
    );
}
