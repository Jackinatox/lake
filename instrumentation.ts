/**
 * Next.js Instrumentation Hook
 * This file is automatically called by Next.js on startup (before any requests)
 * See: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
    // Only run in Node.js runtime, not Edge Runtime (Prisma requires Node.js APIs)
    if (process.env.NEXT_RUNTIME === 'nodejs' || !process.env.NEXT_RUNTIME) {
        const { performVerification } = await import('@/lib/startup');
        console.log('Running startup database constant verification...');
        await performVerification();
    }
}
