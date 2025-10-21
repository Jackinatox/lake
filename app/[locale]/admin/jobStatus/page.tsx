import { Suspense } from "react"
import { JobStatusSkeleton } from "./Job-Status-Sekelton"
import { JobStatusList } from "./Job-Status-List"

export default function Page() {
  return (
    <main className="min-h-screen bg-background p-0 md:p-2">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold text-foreground mb-2">Worker Status</h1>
          <p className="text-muted-foreground">Monitor the status and progress of background jobs</p>
        </header>

        <Suspense fallback={<JobStatusSkeleton />}>
          <JobStatusList />
        </Suspense>
      </div>
    </main>
  )
}
