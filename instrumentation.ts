/**
 * Next.js Instrumentation Hook
 * This file is automatically called by Next.js on startup (before any requests)
 * See: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

import { BatchLogRecordProcessor, LoggerProvider } from '@opentelemetry/sdk-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { logs } from '@opentelemetry/api-logs';
import { resourceFromAttributes } from '@opentelemetry/resources';

// Create LoggerProvider outside register() so it can be exported and flushed in route handlers
export const loggerProvider = new LoggerProvider({
    resource: resourceFromAttributes({
        // Each container sets INSTANCE_ID (e.g. "lake-0"). Falls back to the
        // Docker-assigned hostname so it's never empty.
        'service.name': process.env.INSTANCE_ID ?? process.env.HOSTNAME ?? 'unknown',
        // one common tag for lake-wide log querying in Loki
        'service.instance.id': 'lake',
    }),
    processors: [
        // Route through the local OTel Collector, which fans out to both
        // PostHog and Loki. See otelcol-config.yaml.
        new BatchLogRecordProcessor(
            new OTLPLogExporter({
                url: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://otelcol:4318'}/v1/logs`,
            }),
        ),
    ],
});

export async function register() {
    // Only run in Node.js runtime, not Edge Runtime (Prisma requires Node.js APIs)
    if (process.env.NEXT_RUNTIME === 'nodejs' || !process.env.NEXT_RUNTIME) {
        const otlpUrl = `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://otelcol:4318'}/v1/logs`;
        console.log(`[OTel] Exporting logs to: ${otlpUrl}`);
        const { performVerification } = await import('@/lib/startup');
        console.log('Running startup database constant verification...');
        await performVerification();
        logs.setGlobalLoggerProvider(loggerProvider);
    }
}
