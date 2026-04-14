'use server';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import { authEmailSchema } from '@/lib/validation/auth';

export default async function ForgotPasswordPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const emailParam = (await searchParams).email;
    const email = Array.isArray(emailParam) ? emailParam[0] : emailParam;
    const initialEmail = email && authEmailSchema.safeParse(email).success ? email.trim() : '';

    return (
        <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
            <div className="w-full max-w-sm md:max-w-3xl">
                <ForgotPasswordForm initialEmail={initialEmail} />
            </div>
        </div>
    );
}
