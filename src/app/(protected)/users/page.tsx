'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// La gestión de usuarios fue movida a Configuración > Equipo
export default function UsersRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/settings?tab=equipo');
  }, [router]);
  return null;
}
