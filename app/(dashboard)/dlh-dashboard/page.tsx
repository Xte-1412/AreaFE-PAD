"use client";

import { useAuth } from '@/context/AuthContext';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import { isAxiosError } from 'axios';
import DashboardSkeleton from '@/components/shared/loading/DashboardSkeleton';
import {
    DlhDeadlineCard,
    DlhDokumenStatusCards,
    DlhStatCard,
    DlhTahapanInfo,
    DlhTimelineHorizontal,
} from '@/components/dashboard/dlh';
import type { DlhDashboardData } from '@/types/dlh-dashboard';

const TAHAP_ORDER: Record<string, number> = {
  submission: 1,
  penilaian_slhd: 2,
  penilaian_penghargaan: 3,
  validasi_1: 4,
  validasi_2: 5,
  wawancara: 6,
  selesai: 7,
};

const DocumentIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const RefreshIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
);

// --- MAIN PAGE ---
export default function DLHDashboardPage() {
    const { user, authReady } = useAuth();
    const router = useRouter();
    const [data, setData] = useState<DlhDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [resolvedRole, setResolvedRole] = useState<string | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const stopAutoRefresh = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    useEffect(() => {
        if (!authReady) return;

        if (user?.role?.name) {
            setResolvedRole(user.role.name.toLowerCase());
            return;
        }

        const cachedUser = localStorage.getItem('user_data');
        if (!cachedUser) {
            setResolvedRole(null);
            return;
        }

        try {
            const parsed = JSON.parse(cachedUser) as { role?: { name?: string } };
            setResolvedRole(parsed.role?.name?.toLowerCase() ?? null);
        } catch {
            setResolvedRole(null);
        }
    }, [authReady, user]);

    // Check role and redirect if not DLH
    useEffect(() => {
        if (!authReady || !resolvedRole) {
            return;
        }

        if (resolvedRole === 'admin') {
            router.push('/admin-dashboard');
            return;
        }

        if (resolvedRole === 'pusdatin') {
            router.push('/pusdatin-dashboard');
            return;
        }
    }, [authReady, resolvedRole, router]);

    useEffect(() => {
        const fetchDashboard = async () => {
            if (resolvedRole !== 'provinsi' && resolvedRole !== 'kabupaten/kota') {
                setLoading(false);
                return;
            }
            
            try {
                setLoading(true);
                const response = await axios.get('/api/dinas/dashboard');
                setData(response.data);
                setLastUpdated(new Date());
                setError(null);
            } catch (err: unknown) {
                if (isAxiosError(err) && err.response?.status === 401) {
                    setError('Sesi login Anda berakhir. Silakan login ulang.');
                    return;
                }
                const errorMessage = err instanceof Error ? err.message : 'Gagal memuat data dashboard';
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        if (authReady) {
            fetchDashboard();
        }
    }, [authReady, resolvedRole]);

    // Auto-refresh setiap 30 detik
    useEffect(() => {
        stopAutoRefresh();

        if (resolvedRole !== 'provinsi' && resolvedRole !== 'kabupaten/kota') {
            return;
        }

        intervalRef.current = setInterval(async () => {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                stopAutoRefresh();
                return;
            }

            try {
                const response = await axios.get('/api/dinas/dashboard');
                setData(response.data);
                setLastUpdated(new Date());
            } catch (err: unknown) {
                if (isAxiosError(err) && err.response?.status === 401) {
                    stopAutoRefresh();
                    return;
                }
            }
        }, 30000); // 30 detik

        return () => stopAutoRefresh();
    }, [resolvedRole]);

    useEffect(() => {
        const onLogout = () => stopAutoRefresh();
        window.addEventListener('auth:logout', onLogout);

        return () => {
            window.removeEventListener('auth:logout', onLogout);
            stopAutoRefresh();
        };
    }, []);

    // Manual refresh
    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            const response = await axios.get('/api/dinas/dashboard');
            setData(response.data);
            setLastUpdated(new Date());
            setError(null);
        } catch (err: unknown) {
            console.error('Manual refresh failed:', err);
            const errorMessage = err instanceof Error ? err.message : 'Gagal memuat data dashboard';
            setError(errorMessage);
        } finally {
            setIsRefreshing(false);
        }
    };

    if (loading) {
        return <DashboardSkeleton variant="dlh" />;
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[500px]">
                <div className="text-center">
                    <p className="text-red-600 font-medium">{error}</p>
                    <button 
                        onClick={handleRefresh} 
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Coba Lagi
                    </button>
                </div>
            </div>
        );
    }

    if (!data) return null;

    // Format last updated time
    const formatLastUpdated = (date: Date) => {
        const now = new Date();
        const diff = Math.floor((now.getTime() - date.getTime()) / 1000); // seconds
        
        if (diff < 60) return `${diff} detik yang lalu`;
        if (diff < 3600) return `${Math.floor(diff / 60)} menit yang lalu`;
        return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="space-y-6 p-2">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Selamat Datang, {data.dinas.nama}
                    </h1>
                    <p className="text-gray-500 mt-1">
                        {data.dinas.region} • {data.dinas.type === 'provinsi' ? 'Provinsi' : 'Kabupaten/Kota'}
                        {data.dinas.has_pesisir && ' • Memiliki Pesisir'}
                    </p>
                    {lastUpdated && (
                        <p className="text-xs text-gray-400 mt-1">
                            Terakhir diperbarui: {formatLastUpdated(lastUpdated)}
                        </p>
                    )}
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                        isRefreshing 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50'
                    }`}
                >
                    <RefreshIcon />
                    <span className="font-medium">{isRefreshing ? 'Memperbarui...' : 'Refresh'}</span>
                </button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <DlhStatCard
                    title="Dokumen Terunggah"
                    value={`${data.stats.total_dokumen}/${data.stats.total_required}`}
                    subtitle={`${data.stats.percentage}% lengkap`}
                    icon={<DocumentIcon />}
                    variant={data.stats.percentage === 100 ? 'success' : 'default'}
                />
                <DlhStatCard
                    title="Nilai SLHD"
                    value={data.rekap?.nilai_slhd != null ? Number(data.rekap.nilai_slhd).toFixed(2) : '-'}
                    subtitle={data.rekap?.lolos_slhd ? 'Lolos' : data.rekap?.lolos_slhd === false && TAHAP_ORDER[data.tahapan.tahap_aktif] > TAHAP_ORDER['penilaian_slhd'] ? 'Tidak Lolos' : 'Menunggu penilaian'}
                    variant={data.rekap?.lolos_slhd ? 'success' : data.rekap?.lolos_slhd === false ? 'danger' : 'default'}
                />
                <DlhStatCard
                    title="Jenis Daerah"
                    value={data.dinas.has_pesisir ? 'Pesisir' : 'Daratan'}
                    subtitle={data.dinas.type === 'provinsi' ? 'Provinsi' : 'Kabupaten/Kota'}
                />
                {/* <StatCard
                    title="Tahun Penilaian"
                    value={data.year}
                    subtitle="Periode aktif"
                /> */}
                  <DlhTahapanInfo tahapan={data.tahapan} />
                  {/* <DeadlineCard deadline={data.deadline} /> */}
            </div>
              <DlhTimelineHorizontal items={data.timeline} />

            {/* Hasil Penilaian Section */}
            {data.rekap && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Hasil Penilaian</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                        {/* Nilai SLHD */}
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="text-xs text-gray-500 mb-1">Nilai SLHD</div>
                            <div className="text-2xl font-bold text-gray-800">
                                {data.rekap.nilai_slhd != null ? Number(data.rekap.nilai_slhd).toFixed(0) : '-'}
                            </div>
                            <div className={`text-xs mt-1 ${
                                data.tahapan.tahap_aktif === 'penilaian_slhd' ? 'text-blue-600' :
                                data.rekap.lolos_slhd ? 'text-green-600' : 'text-red-600'
                            }`}>
                                {TAHAP_ORDER[data.tahapan.tahap_aktif] < TAHAP_ORDER['penilaian_slhd'] ? '⏳ Proses' :
                                 data.rekap.lolos_slhd ? '✓ Lolos' : '✗ Tidak Lolos'}
                            </div>
                        </div>

                        {/* Nilai Penghargaan */}
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="text-xs text-gray-500 mb-1">Penghargaan</div>
                            <div className="text-2xl font-bold text-gray-800">
                                {data.rekap.nilai_penghargaan != null ? Number(data.rekap.nilai_penghargaan).toFixed(0) : '-'}
                            </div>
                            <div className={`text-xs mt-1 ${
                                data.tahapan.tahap_aktif === 'penilaian_penghargaan' ? 'text-blue-600' :
                                data.rekap.masuk_penghargaan ? 'text-green-600' : 
                                data.rekap.masuk_penghargaan === false ? 'text-red-600' : 'text-gray-400'
                            }`}>
                                {TAHAP_ORDER[data.tahapan.tahap_aktif] <= TAHAP_ORDER['penilaian_penghargaan'] ? '⏳ Proses' :
                                 data.rekap.masuk_penghargaan ? '✓ Masuk' : 
                                 data.rekap.masuk_penghargaan === false ? '✗ Tidak Masuk' : '-'}
                            </div>
                        </div>

                        {/* Validasi 1 */}
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="text-xs text-gray-500 mb-1">Validasi 1</div>
                            <div className={`text-xl font-bold ${
                                data.tahapan.tahap_aktif === 'validasi1' ? 'text-blue-600' :
                                data.rekap.lolos_validasi1 ? 'text-green-600' : 
                                data.rekap.lolos_validasi1 === false ? 'text-red-600' : 'text-gray-800'
                            }`}>
                                {data.tahapan.tahap_aktif === 'validasi1' ? '⏳ Proses' :
                                 data.rekap.lolos_validasi1 ? '✓ Lolos' : 
                                 data.rekap.lolos_validasi1 === false && data.tahapan.tahap_aktif == 'validasi2'? '✗ Tidak Lolos' : '-'}
                            </div>
                            <div className="text-xs mt-1 text-gray-400">
                                {data.rekap.total_skor_validasi1 != null ? `Skor: ${Number(data.rekap.total_skor_validasi1).toFixed(1)}` : 'belum dimulai'}
                            </div>
                        </div>

                        {/* Validasi 2 */}
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="text-xs text-gray-500 mb-1">Validasi 2</div>
                            <div className={`text-xl font-bold ${
                                data.tahapan.tahap_aktif === 'validasi2' ? 'text-blue-600' :
                                data.rekap.lolos_validasi2 ? 'text-green-600' : 
                                data.rekap.lolos_validasi2 === false ? 'text-red-600' : 'text-gray-800'
                            }`}>
                                {data.tahapan.tahap_aktif === 'validasi2' ? '⏳ Proses' :
                                 data.rekap.lolos_validasi2 ? '✓ Lolos' : 
                                 data.rekap.lolos_validasi2 === false && data.tahapan.tahap_aktif =='wawancara'? '✗ Tidak Lolos' : '-'}
                            </div>
                            <div className="text-xs mt-1 text-gray-400">
                                {data.rekap.peringkat != null ? `Peringkat: ${data.rekap.peringkat}` : 'belum dimulai'}
                            </div>
                        </div>

                        {/* Wawancara */}
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="text-xs text-gray-500 mb-1">Wawancara</div>
                            <div className="text-2xl font-bold text-gray-800">
                                {data.rekap.nilai_wawancara != null ? Number(data.rekap.nilai_wawancara).toFixed(0) : '-'}
                            </div>
                            <div className={`text-xs mt-1 ${
                                data.tahapan.tahap_aktif === 'wawancara' ? 'text-blue-600' :
                                data.rekap.lolos_wawancara ? 'text-green-600' : 'text-gray-400'
                            }`}>
                                {data.tahapan.tahap_aktif === 'wawancara' ? '⏳ Proses' :
                                 data.rekap.lolos_wawancara ? '✓ Selesai' : 'Belum Dimulai'}
                            </div>
                        </div>

                        {/* Skor Final */}
                        <div className="text-center p-4  bg-gray-50 rounded-lg  ">
                            <div className="text-xs text-green-600 mb-1">Skor Final</div>
                            <div className="text-2xl font-bold text-green-600">
                                {data.rekap.total_skor_final != null ? Number(data.rekap.total_skor_final).toFixed(1) : '0'}
                            </div>
                            <div className="text-xs mt-1 text-green-600">
                                {data.rekap.peringkat_final != null ? `Peringkat: #${data.rekap.peringkat_final}` : '-'}
                            </div>
                        </div>

                        {/* Status Akhir */}
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="text-xs text-gray-500 mb-1">Status</div>
                            <div className={`text-xl font-bold ${
                                (() => {
                                    // Mapping tahap_aktif dengan status_akhir
                                    const tahap = data.tahapan.tahap_aktif;
                                    const status = data.rekap.status_akhir;
                                    
                                    // Jika masih dalam proses tahap tertentu, tampilkan biru
                                    if (['submission', 'penilaian_slhd', 'penilaian_penghargaan', 'validasi_1', 'validasi_2', 'wawancara'].includes(tahap)) {
                                        return 'text-blue-600';
                                    }
                                    
                                    // Jika sudah selesai
                                    
                                    if (status?.startsWith('menunggu')) return 'text-blue-600';
                                    if (status?.startsWith('lolos')) return 'text-green-600';
                                    if (status?.startsWith('tidak')) return 'text-red-600';
                                    
                                    return 'text-gray-800';
                                })()
                            }`}>
                                {(() => {
                                    const tahap = data.tahapan.tahap_aktif;
                                    const status = data.rekap.status_akhir;
                                    
                                    if (status) return status.replaceAll('_', ' ').toUpperCase();
                                    return 'Menunggu penilaian';
                                })()}
                            </div>
                        </div>
                        {/* <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="text-xs text-gray-500 mb-1">Status</div>
                            <div className={`text-xl font-bold ${
                                (() => {
                                    // Mapping tahap_aktif dengan status_akhir
                                    const tahap = data.tahapan.tahap_aktif;
                                    const status = data.rekap.status_akhir;
                                    
                                    // Jika masih dalam proses tahap tertentu, tampilkan biru
                                    if (['submission', 'penilaian_slhd', 'penilaian_penghargaan', 'validasi_1', 'validasi_2', 'wawancara'].includes(tahap)) {
                                        return 'text-blue-600';
                                    }
                                    
                                    // Jika sudah selesai
                                    if (status === 'lolos_final') return 'text-green-600';
                                    if (status?.startsWith('tidak')) return 'text-red-600';
                                    
                                    return 'text-gray-800';
                                })()
                            }`}>
                                {(() => {
                                    const tahap = data.tahapan.tahap_aktif;
                                    const status = data.rekap.status_akhir;
                                    
                                    // Mapping status berdasarkan tahap aktif
                                    if (tahap === 'submission') return ' Pengumpulan Dokumen';
                                    if (tahap === 'penilaian_slhd') return ' Penilaian SLHD';
                                    if (tahap === 'penilaian_penghargaan') return ' Penilaian Penghargaan';
                                    if (tahap === 'validasi_1') return ' Validasi Tahap 1';
                                    if (tahap === 'validasi_2') return ' Validasi Tahap 2';
                                    if (tahap === 'wawancara') return ' Wawancara';
                                    
                                    // Jika sudah selesai semua tahap, tampilkan status final
                                    if (status === 'lolos_final') return '🏆 Lolos Final';
                                    if (status === 'tidak_lolos_slhd') return '✗ Tidak Lolos SLHD';
                                    if (status === 'tidak_masuk_penghargaan') return '✗ Tidak Masuk Penghargaan';
                                    if (status === 'tidak_lolos_validasi1') return '✗ Tidak Lolos Validasi 1';
                                    if (status === 'tidak_lolos_validasi2') return '✗ Tidak Lolos Validasi 2';
                                    
                                    return 'Menunggu';
                                })()}
                            </div>
                        </div> */}
                    </div>
                </div>
            )}

            {/* Timeline */}
            

            {/* Grid: Dokumen Status + Sidebar */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2">
                    <DlhDokumenStatusCards 
                        dokumen={data.stats.dokumen} 
                        submissionFinalized={data.stats.submission_finalized}
                    />
                </div>
                <div className="space-y-4">
                    <DlhDeadlineCard deadline={data.deadline} />
                    {/* <TahapanInfo tahapan={data.tahapan} /> */}
                </div>
            </div>
        </div>
    );
}
