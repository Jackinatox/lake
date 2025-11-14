interface ErrorContextInfoProps {
    createdAt: Date;
    gameServer?: {
        id: string;
        name: string | null;
        status: string;
    } | null;
    user?: {
        id: string;
        name: string;
        email: string;
    } | null;
}

export function ErrorContextInfo({ createdAt, gameServer, user }: ErrorContextInfoProps) {
    return (
        <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs text-muted-foreground">
            <span className="whitespace-nowrap">{createdAt.toLocaleString()}</span>
            {gameServer && (
                <span className="flex items-center gap-1 min-w-0">
                    <span className="text-blue-600 dark:text-blue-400 flex-shrink-0">Server:</span>
                    <span className="truncate">{gameServer.name || gameServer.id}</span>
                </span>
            )}
            {user && (
                <span className="flex items-center gap-1 min-w-0">
                    <span className="text-green-600 dark:text-green-400 flex-shrink-0">User:</span>
                    <span className="truncate">{user.name || user.email}</span>
                </span>
            )}
        </div>
    );
}
