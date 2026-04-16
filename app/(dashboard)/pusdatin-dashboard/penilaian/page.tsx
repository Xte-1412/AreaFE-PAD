'use client';

import InnerNav from '@/components/InnerNav';
import ProgressCard from '@/components/ProgressCard';
import { ToastProvider } from '@/components/ui';
import { FaSpinner } from 'react-icons/fa';
import { usePenilaianTabState } from '@/hooks/penilaian/usePenilaianTabState';
import { usePenilaianSharedData } from '@/hooks/penilaian/usePenilaianSharedData';

import {
    TabPenilaianSLHD,
    TabPenilaianPenghargaan,
    TabValidasi1,
    TabValidasi2,
    TabPenetapanPeringkat,
    TabWawancara,
} from '@/components/dashboard/pusdatin/penilaian/PenilaianTabs';

export default function PenilaianPage() {
    const year = new Date().getFullYear();
    const { activeTab, visitedTabs, handleTabChange } = usePenilaianTabState();
    const {
        provinsiList,
        submissions,
        sharedDataLoading,
        progressData,
        refreshSubmissions,
    } = usePenilaianSharedData(year);

    // KONFIGURASI TAB NAVIGASI
    const tabs = [
        { label: 'Penilaian SLHD', value: 'slhd' },
        { label: 'Penilaian Penghargaan', value: 'penghargaan' },
        { label: 'Validasi 1', value: 'validasi1' },
        { label: 'Validasi 2', value: 'validasi2' },
        { label: 'Penetapan Peringkat', value: 'peringkat' },
        { label: 'Wawancara', value: 'wawancara' },
    ];

    // RENDER KONTEN DINAMIS BERDASARKAN TAB AKTIF
    // Menggunakan conditional rendering dengan cache - tab yang sudah pernah dibuka tetap di-mount (hidden)
    const renderContent = () => {
        if (sharedDataLoading) {
            return (
                <div className="flex items-center justify-center py-20">
                    <FaSpinner className="animate-spin text-green-600 text-3xl" />
                    <span className="ml-3 text-gray-600">Memuat data...</span>
                </div>
            );
        }
        
        return (
            <>
                {/* SLHD - selalu render karena default tab */}
                <div className={activeTab === 'slhd' ? 'block' : 'hidden'}>
                    <TabPenilaianSLHD provinsiList={provinsiList} submissions={submissions} onRefreshSubmissions={refreshSubmissions} />
                </div>
                
                {/* Penghargaan - lazy load */}
                {visitedTabs.has('penghargaan') && (
                    <div className={activeTab === 'penghargaan' ? 'block' : 'hidden'}>
                        <TabPenilaianPenghargaan provinsiList={provinsiList} submissions={submissions} />
                    </div>
                )}
                
                {/* Validasi 1 - lazy load */}
                {visitedTabs.has('validasi1') && (
                    <div className={activeTab === 'validasi1' ? 'block' : 'hidden'}>
                        <TabValidasi1 provinsiList={provinsiList} submissions={submissions} />
                    </div>
                )}
                
                {/* Validasi 2 - lazy load */}
                {visitedTabs.has('validasi2') && (
                    <div className={activeTab === 'validasi2' ? 'block' : 'hidden'}>
                        <TabValidasi2 provinsiList={provinsiList} submissions={submissions} />
                    </div>
                )}
                
                {/* Penetapan Peringkat - lazy load */}
                {visitedTabs.has('peringkat') && (
                    <div className={activeTab === 'peringkat' ? 'block' : 'hidden'}>
                        <TabPenetapanPeringkat />
                    </div>
                )}
                
                {/* Wawancara - lazy load */}
                {visitedTabs.has('wawancara') && (
                    <div className={activeTab === 'wawancara' ? 'block' : 'hidden'}>
                        <TabWawancara />
                    </div>
                )}
            </>
        );
    };

    return (
        <ToastProvider>
            <div className="space-y-6 pb-10 animate-fade-in">
                
                {/* BREADCRUMB */}
                <div className="flex items-center text-sm text-gray-500">
                    <span className="text-green-600 cursor-pointer hover:underline">Penilaian</span>
                    <span className="mx-2">&gt;</span>
                    <span className="font-medium text-gray-700">Penilaian Kab/Kota</span>
                </div>

                {/* HEADER UTAMA */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">
                        Penilaian Nirwasita Tantra 
                    </h1>
                    <p className="text-sm text-gray-500">
                        Atur Penilaian Nilai Nirwasita Tantra dari Dokumen-Dokumen Kab/Kota.
                    </p>
                </div>

                {/* PROGRESS CARDS - Ringkasan Progres */}
                <div>
                    <h2 className="text-base font-bold text-gray-800 mb-4">Ringkasan Progres</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {progressData.map((item, index) => (
                            <div 
                                key={index}
                                onClick={() => handleTabChange(item.tabValue)}
                                className="cursor-pointer"
                            >
                                <ProgressCard
                                    stage={item.stage}
                                    progress={item.progress}
                                    detail={item.detail}
                                    isCompleted={item.isCompleted}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* DETAIL PENILAIAN & NAVIGASI */}
                <div>
                    <h2 className="text-base font-bold text-gray-800 mb-4">Detail Penilaian</h2>
                    
                    <InnerNav 
                        tabs={tabs} 
                        activeTab={activeTab} 
                        onChange={handleTabChange} 
                        activeColor="green"
                        className="mb-6"
                    />

                    {renderContent()}
                </div>
            </div>
        </ToastProvider>
    );
}

