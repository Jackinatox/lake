import { JobStatusCard } from "./Job-Status-Card"
import { ErrorSection } from "./ErrorSection"
import { JobStatus, JobStatusMap } from "../../../../worker/workerTypes"
import { prisma } from "@/prisma"

// Async function to fetch job statuses
async function getJobStatuses(): Promise<JobStatusMap> {
    // TODO: Replace with actual API call
    // const response = await fetch('/status', { cache: 'no-store' })
    // if (!response.ok) throw new Error('Failed to fetch job statuses')
    // return response.json()

    // Dummy data for development
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return {
        "SendingEmails": {
            running: true,
            processed: 1247,
            total: 2500,
            lastRun: "2 minutes ago",
        },
        "Data Sync": {
            running: false,
            processed: 5000,
            total: 5000,
            lastRun: "15 minutes ago",
        }
    }
}

export async function JobStatusList() {
    const jobStatuses = await getJobStatuses()
    const errorCount = await prisma.workerLog.count({
        where: {
            level: { in: ['ERROR', 'FATAL'] },
            createdAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // last 24 hours
            }
        }
    })
    
    const recentErrors = await prisma.workerLog.findMany({
        where: {
            level: { in: ['ERROR', 'FATAL'] },
            createdAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // last 24 hours
            }
        },
        include: {
            gameServer: {
                select: { id: true, name: true, status: true }
            },
            user: {
                select: { id: true, name: true, email: true }
            }
        },
        orderBy: {
            createdAt: 'desc'
        },
        take: 10 // Show last 10 errors
    })

    return (
        <div className="px-1 md:px-0">
            <div className="grid gap-3 md:gap-4 md:grid-cols-2">
                {Object.entries(jobStatuses).map(([jobName, job]) => {
                    return <JobStatusCard key={jobName} job={job} jobName={jobName} />
                })}
            </div>
            
            <ErrorSection errorCount={errorCount} recentErrors={recentErrors} />
        </div>
    )
}
