import React from 'react'
import LawyerShell from '../../components/layout/LawyerShell'

export default function LawyerLayout({ children }: { children: React.ReactNode }) {
  return <LawyerShell>{children}</LawyerShell>
}