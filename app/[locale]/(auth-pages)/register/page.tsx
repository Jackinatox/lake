import { RegisterForm } from '@/components/auth/register-form';
import React from 'react';

function page() {
    return (
        <div className="flex flex-col items-center justify-center p-0 md:p-10">
            <div className="w-full md:max-w-3xl">
                <RegisterForm />
            </div>
        </div>
    );
}

export default page;
