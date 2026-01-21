'use client';

import { useState } from 'react';
import { JobStatusGrid } from './JobStatusGridNew';
import { RecentRunsTable } from './RecentRunsTable';
import { JobRunDetailsModal } from './JobRunDetailsModal';

export function JobStatusPageClient() {
    const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleViewDetails = (runId: string) => {
        setSelectedRunId(runId);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        // Small delay before clearing to allow modal to close smoothly
        setTimeout(() => setSelectedRunId(null), 300);
    };

    return (
        <main className="min-h-screen bg-background p-0 md:p-2">
            <div className="mx-auto max-w-7xl">
                <header className="mb-8 px-1 md:px-0">
                    <h1 className="text-3xl font-semibold text-foreground mb-2">
                        Worker Job Dashboard
                    </h1>
                    <p className="text-muted-foreground">
                        Monitor, manage, and trigger background worker jobs in real-time
                    </p>
                </header>

                <div className="space-y-6 px-1 md:px-0">
                    {/* Job Status Cards */}
                    <section>
                        <h2 className="text-xl font-semibold mb-4">Active Jobs</h2>
                        <JobStatusGrid />
                    </section>

                    {/* Recent Runs Table */}
                    <section>
                        <RecentRunsTable onViewDetails={handleViewDetails} />
                    </section>
                </div>
            </div>

            {/* Details Modal */}
            <JobRunDetailsModal
                runId={selectedRunId}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
            />
        </main>
    );
}
