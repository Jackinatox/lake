import posthog from 'posthog-js';

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    defaults: '2026-01-30',
    opt_out_capturing_by_default: true,
});
