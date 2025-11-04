import { LogLevel } from "@prisma/client"

interface ErrorBadgeProps {
    level: LogLevel
}

export function ErrorBadge({ level }: ErrorBadgeProps) {
    const isError = level === 'ERROR' || level === 'FATAL'
    const isFatal = level === 'FATAL'
    
    return (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            isFatal 
                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                : isError
                ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
        }`}>
            {level}
        </span>
    )
}

interface JobTypeBadgeProps {
    jobType: string
}

export function JobTypeBadge({ jobType }: JobTypeBadgeProps) {
    return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {jobType}
        </span>
    )
}

interface JobRunIdProps {
    jobRun: string
}

export function JobRunId({ jobRun }: JobRunIdProps) {
    return (
        <span className="text-xs text-muted-foreground font-mono">
            {jobRun}
        </span>
    )
}