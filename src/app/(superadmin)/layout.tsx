'use client';
import SuperAdminLayout from '@/components/layouts/SuperAdminLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <SuperAdminLayout>{children}</SuperAdminLayout>
    </ProtectedRoute>
  );
}
