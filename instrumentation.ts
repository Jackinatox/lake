/**
 * Next.js Instrumentation Hook
 * This file is automatically called by Next.js on startup (before any requests)
 * See: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

import { BatchLogRecordProcessor, LoggerProvider } from '@opentelemetry/sdk-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { logs } from '@opentelemetry/api-logs';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { env } from 'next-runtime-env';

// Create LoggerProvider outside register() so it can be exported and flushed in route handlers
export const loggerProvider = new LoggerProvider({
    resource: resourceFromAttributes({ 'service.name': 'lake-backend' }),
    processors: [
        new BatchLogRecordProcessor(
            new OTLPLogExporter({
                url: 'https://eu.i.posthog.com/i/v1/logs',
                headers: {
                    Authorization: `Bearer ${env('NEXT_PUBLIC_POSTHOG_KEY')}`,
                    'Content-Type': 'application/json',
                },
            }),
        ),
    ],
});

export async function register() {
    // Only run in Node.js runtime, not Edge Runtime (Prisma requires Node.js APIs)
    if (process.env.NEXT_RUNTIME === 'nodejs' || !process.env.NEXT_RUNTIME) {
        const { performVerification } = await import('@/lib/startup');
        console.log('Running startup database constant verification...');
        await performVerification();
        logs.setGlobalLoggerProvider(loggerProvider);
    }
}
