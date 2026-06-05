import React from 'react'
import RequireLawyer from '../../../components/auth/RequireLawyer'

export const metadata = {
  title: 'My Office',
}

export default function LawyerOfficeLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireLawyer>
      {children}
    </RequireLawyer>
  )
}
