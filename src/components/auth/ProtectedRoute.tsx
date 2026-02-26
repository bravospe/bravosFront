'use client';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import LaserLoader from '@/components/ui/LaserLoader';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isClient, isAuthenticated, router]);

  if (!isClient) {
    return <LaserLoader />; // Show loader while hydrating
  }

  if (!isAuthenticated) {
    return <LaserLoader />; // Show loader while redirecting
  }

  return <>{children}</>;
}
