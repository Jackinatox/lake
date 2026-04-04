'use server';

import React from 'react';
import AdminPage from './adminPage';
import { auth } from '@/auth';
import NoAdmin from '../../../components/admin/NoAdminMessage';
import { headers } from 'next/headers';

async function Admin() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (session?.user.role !== 'admin') {
        return <NoAdmin />;
    }

    return <AdminPage />;
}

export default Admin;
