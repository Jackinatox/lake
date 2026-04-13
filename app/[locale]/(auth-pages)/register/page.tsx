import { RegisterForm } from '@/components/auth/register-form';

function Page() {
    return (
        <div className="flex flex-col items-center justify-center sm:px-6 md:p-10">
            <div className="w-full sm:max-w-md">
                <RegisterForm />
            </div>
        </div>
    );
}

export default Page;
