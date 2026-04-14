'use client';

import { ChangePasswordForm } from '@/components/auth/change-password-form';
import TwoFactorSetup from './security/TwoFactorSetup';
import SessionManager from './security/SessionManager';

export default function SecurityTab() {
    return (
        <div className="space-y-4">
            <TwoFactorSetup />
            <ChangePasswordForm />
            <SessionManager />
        </div>
    );
}
