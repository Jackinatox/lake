'use server'

import React from 'react'
import AdminPage from './adminPage'
import { SettingsIcon } from 'lucide-react'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from '@/components/ui/breadcrumb'
import { auth } from '@/auth'
import NoAdmin from '../../../components/admin/NoAdminMessage'
import { headers } from 'next/headers'

async function Admin() {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (session?.user.role !== 'ADMIN') {
        return <NoAdmin />;
    }

    return (
        <>
            <div className="mb-4">
                <Breadcrumb>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="#" className="flex items-center gap-2 text-muted-foreground">
                            <SettingsIcon className="h-4 w-4" />
                            Admin Panel
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                </Breadcrumb>
            </div>

            <div className='flex justify-center'>
                <AdminPage />
            </div>
        </>
    )
}

export default Admin
