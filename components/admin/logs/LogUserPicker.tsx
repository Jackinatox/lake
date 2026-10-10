'use client';

import { useTranslations } from 'next-intl';
import AdminUserPicker from '@/components/admin/AdminUserPicker';

type LogUserPickerProps = {
    value?: string;
    onChange: (userId?: string) => void;
};

/** The log viewer's translated wrapper around the shared admin user combobox. */
export default function LogUserPicker({ value, onChange }: LogUserPickerProps) {
    const t = useTranslations('adminLogs.filters');

    return (
        <AdminUserPicker
            value={value}
            onChange={onChange}
            labels={{
                all: t('allUsers'),
                searchPlaceholder: t('userSearchPlaceholder'),
                empty: t('noUsers'),
                clear: t('clearUser'),
            }}
        />
    );
}
