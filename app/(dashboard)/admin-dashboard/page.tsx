'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import axios from '@/lib/axios';
import type { DashboardData, TimelineItem } from '@/types/admin-dashboard';
import DashboardSkeleton from '@/components/shared/loading/DashboardSkeleton';
import {
  AdminDashboardHeader,
  AdminQuickLinks,
  AdminUserStatsCards,
  SummaryCards,
  TahapanInfoCard,
  TimelineDetailModal,
  TimelineHorizontal,
} from '@/components/admin-dashboard';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimelineItem, setSelectedTimelineItem] = useState<TimelineItem | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Role guard
  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }
    
    const role = user.role?.name?.toLowerCase();
    if (role !== 'admin') {
      // Redirect ke dashboard yang sesuai
      if (role === 'pusdatin') router.replace('/pusdatin-dashboard');
      else if (role === 'provinsi' || role === 'kabupaten/kota') router.replace('/dlh-dashboard');
      else router.replace('/login');
    }
  }, [user, router]);

  const fetchDashboard = async () => {
    if (!user) return;
    
    try {
      const res = await axios.get('/api/admin/dashboard');
      setData(res.data);
    } catch (error) {
      console.error('Gagal mengambil statistik dashboard:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDashboard();
  };

  const handleUnfinalize = async (tahap: string) => {
    if (!data) return;
    
    // Map tahap to API endpoint
    const tahapEndpointMap: Record<string, string> = {
      penilaian_slhd: 'slhd',
      penilaian_penghargaan: 'penghargaan',
      validasi_1: 'validasi1',
      validasi_2: 'validasi2',
      wawancara: 'wawancara',
    };
    
    const endpoint = tahapEndpointMap[tahap];
    if (!endpoint) {
      throw new Error('Tahap ini tidak dapat di-unfinalize');
    }

    await axios.patch(`/api/admin/unfinalize/${endpoint}/${data.year}`);
    await fetchDashboard();
  };

  if (!user || loading) {
    return <DashboardSkeleton variant="dlh" />;
  }

  if (!data) return null;

  return (
    <div className="p-8 space-y-6">
      <AdminDashboardHeader isRefreshing={isRefreshing} onRefresh={handleRefresh} />

      {/* Timeline Penilaian */}
      {data.timeline_penilaian && (
        <>
          {/* Tahap Aktif + Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4">
              <TahapanInfoCard timeline={data.timeline_penilaian} />
            </div>
            <div className="lg:col-span-8">
              <SummaryCards 
                summary={data.timeline_penilaian.summary}
                submissions={data.submissions}
              />
            </div>
          </div>

          {/* Timeline */}
          <TimelineHorizontal 
            items={data.timeline_penilaian.timeline}
            year={data.year}
            onItemClick={setSelectedTimelineItem}
          />

          <AdminUserStatsCards totalUsersAktif={data.total_users_aktif} totalUsersPending={data.total_users_pending} />
        </>
      )}

      <AdminQuickLinks />

      {/* Timeline Detail Modal */}
      {selectedTimelineItem && (
        <TimelineDetailModal
          item={selectedTimelineItem}
          onClose={() => setSelectedTimelineItem(null)}
          onUnfinalize={handleUnfinalize}
        />
      )}
    </div>
  );
}