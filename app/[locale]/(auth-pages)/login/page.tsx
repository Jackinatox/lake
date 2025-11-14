import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
    return (
        <div className="flex flex-col items-center justify-center p-0 md:p-6">
            <div className="w-full md:max-w-3xl">
                <LoginForm />
            </div>
        </div>
    );
}
