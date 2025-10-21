import { ErrorStatusHeader } from "./ErrorStatusHeader"
import { ErrorCard } from "./ErrorCard"
import { ErrorEmptyState } from "./ErrorEmptyState"
import { WorkerLogLevel } from "../../../../worker/generated/client"

interface ErrorSectionProps {
    errorCount: number
    recentErrors: Array<{
        id: number
        level: WorkerLogLevel
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
    }>
}

export function ErrorSection({ errorCount, recentErrors }: ErrorSectionProps) {
    return (
        <section className="mt-4 md:mt-8 rounded-lg border border-border bg-card p-3 md:p-6">
            <ErrorStatusHeader errorCount={errorCount} />
            
            {recentErrors.length > 0 ? (
                <div className="space-y-2 md:space-y-3">
                    {recentErrors.map((error) => (
                        <ErrorCard key={error.id} error={error} />
                    ))}
                </div>
            ) : (
                <ErrorEmptyState />
            )}
        </section>
    )
}