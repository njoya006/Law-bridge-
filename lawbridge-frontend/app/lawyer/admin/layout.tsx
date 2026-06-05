import React from 'react'
import RequireFirmAdmin from '../../../components/auth/RequireFirmAdmin'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireFirmAdmin>
      {children}
    </RequireFirmAdmin>
  )
}
