'use client';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function Layout({ children }: { children: React.ReactNode }) {
  // Protected layout wrapper
  return (
    <ProtectedRoute>
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedRoute>
  );
}
