import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
    return (
        <div className="flex flex-col items-center justify-center sm:px-6 md:p-10">
            <div className="w-full sm:max-w-md">
                <LoginForm />
            </div>
        </div>
    );
}
