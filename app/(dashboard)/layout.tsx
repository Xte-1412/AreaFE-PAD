// src/app/(dashboard)/layout.tsx
"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import DashboardSkeleton from '@/components/shared/loading/DashboardSkeleton';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, authReady } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!authReady) {
      setIsChecking(true);
      return;
    }

    const checkAuth = () => {
      const token = localStorage.getItem('auth_token');
      
      // Tidak ada token = redirect ke login
      if (!token) {
        router.push('/login');
        return;
      }
      
      // Cek role dan pastikan di dashboard yang benar
      if (user?.role?.name) {
        const roleName = user.role.name.toLowerCase();
        const correctDashboard = 
          roleName === 'admin' ? '/admin-dashboard' :
          roleName === 'pusdatin' ? '/pusdatin-dashboard' :
          (roleName === 'provinsi' || roleName === 'kabupaten/kota') ? '/dlh-dashboard' : null;
        
        // Jika user di dashboard yang salah, redirect ke yang benar
        if (correctDashboard && !pathname.startsWith(correctDashboard)) {
          router.push(correctDashboard);
          return;
        }
      }
      
      setIsChecking(false);
    };
    
    checkAuth();
  }, [user, authReady, router, pathname]);

  // Loading state (skeleton)
  if (isChecking) {
    return <DashboardSkeleton variant="layout" />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow p-8">
        {children}
      </main>
    </div>
  );
}