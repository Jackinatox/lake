"use server"

import { ResetPasswordForm } from "@/components/auth/reset-password-form"

export default async function ResetPasswordPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | undefined }>
}) {
    const params = await searchParams;

    const token = params.token;
    const error = params.error;

    return (
        <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
            <div className="w-full max-w-sm md:max-w-3xl">
                <ResetPasswordForm token={token} initialError={error} />
            </div>
        </div>
    )
}
