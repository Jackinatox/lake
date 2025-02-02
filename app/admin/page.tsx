import React from 'react'
import AdminPage from './adminPage'
import { Breadcrumbs, Link, Typography } from '@mui/joy'
import { SettingsIcon, UserIcon } from 'lucide-react'

function Admin() {
  return (
    <>
      <Breadcrumbs separator="›" aria-label="breadcrumbs">

        <Typography sx={{ display: 'flex', alignItems: 'center' }}>
          <SettingsIcon />
          Admin Panel
        </Typography>

      </Breadcrumbs>

      <AdminPage></AdminPage>
    </>
  )
}

export default Admin