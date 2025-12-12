import { Outlet } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ToolErrorBoundary from '@/components/tools/common/ToolErrorBoundary';

export default function ToolsPage() {
  return (
    <DashboardLayout>
      <ToolErrorBoundary>
        <Outlet />
      </ToolErrorBoundary>
    </DashboardLayout>
  );
}
