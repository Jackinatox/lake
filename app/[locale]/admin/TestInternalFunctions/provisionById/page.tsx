import React from 'react'
import ProvisionServerTest from './provision-server-test'
import { auth } from '@/auth'
import NoAdmin from '../../../../../components/admin/NoAdminMessage';
import { headers } from 'next/headers';

async function page() {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (session?.user.role != 'ADMIN')
        return <NoAdmin />

    return (
        <div><ProvisionServerTest /></div>
    )
}

export default page