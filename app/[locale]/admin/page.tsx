'use client'

import React from 'react'
import AdminPage from './adminPage'
import { SettingsIcon } from 'lucide-react'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from '@/components/ui/breadcrumb'

function Admin() {
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

      <AdminPage />
    </>
  )
}

export default Admin
