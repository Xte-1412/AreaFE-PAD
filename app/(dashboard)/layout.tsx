// src/app/(dashboard)/layout.tsx
"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

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
    return (
      <div className="p-8 space-y-6 min-h-screen">
        <div className="h-8 w-72 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="h-28 bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-28 bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-28 bg-gray-200 rounded-xl animate-pulse" />
        </div>
        <div className="h-64 bg-gray-200 rounded-xl animate-pulse" />
        <div className="h-40 bg-gray-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow p-8">
        {children}
      </main>
    </div>
  );
}