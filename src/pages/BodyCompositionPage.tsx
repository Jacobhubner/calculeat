import { Outlet } from 'react-router-dom'
import DashboardLayout from '@/components/layout/DashboardLayout'

export default function BodyCompositionPage() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  )
}
