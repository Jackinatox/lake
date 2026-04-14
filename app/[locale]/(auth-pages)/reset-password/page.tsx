'use server';

import { ResetPasswordForm } from '@/components/auth/reset-password-form';
import { requiredStringSchema } from '@/lib/validation/common';

export default async function ResetPasswordPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
    const params = await searchParams;
    const token =
        typeof params.token === 'string' &&
        requiredStringSchema('Reset token', 2048).safeParse(params.token).success
            ? params.token.trim()
            : undefined;
    const error =
        typeof params.error === 'string' && params.error.trim().length <= 500
            ? params.error.trim()
            : undefined;

    return (
        <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
            <div className="w-full max-w-sm md:max-w-3xl">
                <ResetPasswordForm token={token} initialError={error} />
            </div>
        </div>
    );
}
