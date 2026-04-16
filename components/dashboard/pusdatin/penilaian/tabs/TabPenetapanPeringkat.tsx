'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from '@/lib/axios';
import { useToast, ConfirmModal } from '@/components/ui';
import { FaSpinner, FaLock } from 'react-icons/fa';
import { getHttpErrorMessage } from './httpError';

import type {
    RankedData
} from '@/types/penilaian';
// --- KOMPONEN TAB PENETAPAN PERINGKAT ---
export function TabPenetapanPeringkat() {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [rankedData, setRankedData] = useState<RankedData[]>([]);
    const [selectedKategori, setSelectedKategori] = useState<string>('');
    const [selectedJenisPeringkat, setSelectedJenisPeringkat] = useState<string>('top5');
    const [topN, setTopN] = useState<number>(5);
    const [isCreatingWawancara, setIsCreatingWawancara] = useState(false);

    // Modal state
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const year = new Date().getFullYear();

    const kategoriOptions = [
        { value: '', label: 'Pilih Jenis DLH' },
        { value: 'provinsi', label: 'Provinsi' },
        { value: 'kabupaten_besar', label: 'Kabupaten Besar' },
        { value: 'kabupaten_sedang', label: 'Kabupaten Sedang' },
        { value: 'kabupaten_kecil', label: 'Kabupaten Kecil' },
        { value: 'kota_besar', label: 'Kota Besar' },
        { value: 'kota_sedang', label: 'Kota Sedang' },
        { value: 'kota_kecil', label: 'Kota Kecil' },
    ];

    const jenisPeringkatOptions = [
        { value: 'top5', label: 'Top 5' },
        { value: 'top10', label: 'Top 10' },
        { value: 'custom', label: 'Custom' },
        { value: 'all', label: 'Semua' },
    ];

    // Fetch ranked data
    const fetchRankedData = useCallback(async () => {
        if (!selectedKategori) {
            setRankedData([]);
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const response = await axios.get(`/api/pusdatin/penilaian/validasi-2/${year}/ranked`, {
                params: { kategori: selectedKategori, top: selectedJenisPeringkat === 'all' ? 999 : topN }
            });
            setRankedData(response.data?.data || response.data || []);
        } catch (err: unknown) {
            console.error('Error fetching ranked data:', err);
            setRankedData([]);
        } finally {
            setLoading(false);
        }
    }, [year, selectedKategori, selectedJenisPeringkat, topN]);

    useEffect(() => {
        fetchRankedData();
    }, [fetchRankedData]);

    // Update topN based on jenis peringkat
    useEffect(() => {
        if (selectedJenisPeringkat === 'top5') setTopN(5);
        else if (selectedJenisPeringkat === 'top10') setTopN(10);
        else if (selectedJenisPeringkat === 'custom' && topN === 5) setTopN(1); // Set default for custom
        // Don't change topN for 'all' or when custom value is already set
    }, [selectedJenisPeringkat, topN]);

    // Create wawancara (finalisasi ranking)
    const handleCreateWawancara = async () => {
        try {
            setIsCreatingWawancara(true);
            await axios.post(`/api/pusdatin/penilaian/validasi-2/${year}/create-wawancara`, {
                top: topN
            }, { timeout: 300000 });
            showToast('success', 'Penetapan peringkat berhasil difinalisasi. Data peserta wawancara telah dibuat.');
            setShowConfirmModal(false);
        } catch (err: unknown) {
            console.error('Error creating wawancara:', err);
            showToast('error', getHttpErrorMessage(err, 'Gagal membuat data wawancara'));
        } finally {
            setIsCreatingWawancara(false);
        }
    };

    // Get medal emoji
    const getMedal = (rank: number) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return '';
    };

    return (
        <div className="space-y-6">
            {/* Filter Section */}
            <div className="flex flex-wrap gap-4 items-end">
                <div className="w-56">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Pembagian Daerah</label>
                    <select 
                        value={selectedKategori}
                        onChange={(e) => setSelectedKategori(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                        {kategoriOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
                <div className="w-48">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Jenis Peringkat</label>
                    <select 
                        value={selectedJenisPeringkat}
                        onChange={(e) => setSelectedJenisPeringkat(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                        {jenisPeringkatOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
                {selectedJenisPeringkat === 'custom' && (
                    <div className="w-32">
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Jumlah Top</label>
                        <input
                            type="number"
                            min="1"
                            max="999"
                            value={topN}
                            onChange={(e) => setTopN(Math.max(1, Math.min(999, parseInt(e.target.value) || 1)))}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="Top N"
                        />
                    </div>
                )}
                <button
                    onClick={fetchRankedData}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                    Filter
                </button>
            </div>

            {/* Tabel Peringkat */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                    <h3 className="font-bold text-gray-800">Tabel Peringkat</h3>
                </div>
                
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <FaSpinner className="animate-spin text-green-600 text-2xl" />
                        <span className="ml-3 text-gray-600">Memuat data...</span>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600">Rank</th>
                                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600">Nama Daerah</th>
                                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600">Jenis DLH</th>
                                    <th className="py-3 px-4 text-center text-xs font-semibold text-gray-600">Nilai NT</th>
                                    <th className="py-3 px-4 text-center text-xs font-semibold text-gray-600">Kenaikan NT</th>
                                    <th className="py-3 px-4 text-center text-xs font-semibold text-gray-600">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {!selectedKategori ? (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-gray-500">
                                            Silakan pilih Jenis DLH terlebih dahulu
                                        </td>
                                    </tr>
                                ) : rankedData.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-gray-500">
                                            Belum ada data peringkat untuk kategori ini
                                        </td>
                                    </tr>
                                ) : (
                                    rankedData.map((item) => (
                                        <tr key={item.id_dinas} className="hover:bg-gray-50">
                                            <td className="py-3 px-4 text-sm text-gray-800">
                                                <span className="inline-flex items-center gap-1">
                                                    {getMedal(item.peringkat)} {item.peringkat}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-sm font-medium text-green-600 hover:underline cursor-pointer">
                                                {item.nama_dinas.replace('DLH ', '').replace('Dinas Lingkungan Hidup ', '')}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-600 capitalize">
                                                {item.kategori.replace(/_/g, ' ')}
                                            </td>
                                            <td className="py-3 px-4 text-center text-sm text-gray-800">
                                                {Number(item.Total_Skor)?.toFixed(1) ?? '-'}
                                            </td>
                                            <td className="py-3 px-4 text-center text-sm text-green-600">
                                                +{((Number(item.Total_Skor) || 0) * 0.05).toFixed(1)}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                {item.peringkat <= topN && (
                                                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                                                        Top {topN}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Tombol Finalisasi */}
            {rankedData.length > 0 && (
                <div className="flex justify-end">
                    <button
                        onClick={() => setShowConfirmModal(true)}
                        disabled={isCreatingWawancara}
                        className="bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isCreatingWawancara ? (
                            <>
                                <FaSpinner className="animate-spin" /> Memproses...
                            </>
                        ) : (
                            <>
                                <FaLock /> Finalisasi Penetapan Peringkat
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Confirmation Modal */}
            <ConfirmModal
                isOpen={showConfirmModal}
                title="Finalisasi Penetapan Peringkat"
                message={`Apakah Anda yakin ingin memfinalisasi peringkat? Top ${topN} dari setiap kategori akan masuk ke tahap wawancara.`}
                confirmText="Ya, Finalisasi"
                cancelText="Batal"
                type="warning"
                onConfirm={handleCreateWawancara}
                onCancel={() => setShowConfirmModal(false)}
                isLoading={isCreatingWawancara}
            />
        </div>
    );
}
