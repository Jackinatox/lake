import React from 'react'
import ProvisionServerTest from './provision-server-test'
import { auth } from '@/auth'
import NoAdmin from '../../NoAdmin';

async function page() {
    const session = await auth();

    if (session?.user.role != 'ADMIN')
        return <NoAdmin />
        
        return (
            <div><ProvisionServerTest /></div>
        )
}

export default page