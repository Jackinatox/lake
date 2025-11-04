import { LogLevel } from "@prisma/client"
import { ErrorBadge, JobTypeBadge, JobRunId } from "./ErrorBadges"
import { ErrorContextInfo } from "./ErrorContextInfo"

interface ErrorCardProps {
    error: {
        id: number
        level: LogLevel
        jobType: string
        jobRun: string | null
        message: string
        details: any
        createdAt: Date
        gameServer?: {
            id: string
            name: string | null
            status: string
        } | null
        user?: {
            id: string
            name: string
            email: string
        } | null
    }
}

export function ErrorCard({ error }: ErrorCardProps) {
    return (
        <div className="border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20 rounded-md p-2 md:p-4 transition-colors hover:bg-red-100 dark:hover:bg-red-950/30">
            <details className="text-xs group">
                <summary className="list-none">
                    <div className="flex justify-between items-start gap-2 mb-2">
                        <div className="flex flex-wrap items-center gap-1 md:gap-2">
                            <ErrorBadge level={error.level} />
                            <JobTypeBadge jobType={error.jobType} />
                            {error.jobRun && <JobRunId jobRun={error.jobRun} />}
                        </div>
                        
                        {error.details && (
                            <span className="cursor-pointer text-muted-foreground hover:text-foreground select-none flex items-center gap-1 px-2 py-1 rounded border border-border hover:border-foreground/20 bg-background/50 hover:bg-background transition-colors">
                                <span>Details</span>
                                <svg className="w-3 h-3 transition-transform duration-200 group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </span>
                        )}
                    </div>
                    
                    <p className="text-sm font-medium text-foreground mb-1 break-words">
                        {error.message}
                    </p>
                    
                    <ErrorContextInfo 
                        createdAt={error.createdAt}
                        gameServer={error.gameServer}
                        user={error.user}
                    />
                </summary>
                
                {error.details && (
                    <div className="mt-2">
                        <pre className="p-2 bg-muted rounded text-xs overflow-x-auto w-full">
                            {JSON.stringify(error.details, null, 2)}
                        </pre>
                    </div>
                )}
            </details>
        </div>
    )
}