'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import axios from '@/lib/axios';
import { useToast, ConfirmModal, FinalizedBadge } from '@/components/ui';
import { FaSpinner, FaLock } from 'react-icons/fa';
import { getHttpErrorMessage } from './httpError';

import type {
    ParsedValidasi2,
    TabProps
} from '@/types/penilaian';
// --- KOMPONEN TAB VALIDASI 2 ---
export function TabValidasi2({ provinsiList, submissions }: TabProps) {
    const { showToast } = useToast();
    const [parsedData, setParsedData] = useState<ParsedValidasi2[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFinalized, setIsFinalized] = useState(false);
    const [currentPageParsed, setCurrentPageParsed] = useState(1);
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    
    // Filter independen untuk hasil validasi
    const tipeFilterParsed: 'all' | 'provinsi' | 'kabupaten/kota' = 'all';
    const [provinsiFilterParsed, setProvinsiFilterParsed] = useState<string>('');
    const statusFilterParsed: 'all' | 'lolos' | 'tidak_lolos' | 'pending' = 'all';
    const itemsPerPageParsed: number | 'all' = 'all';

    // Modal state
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isFinalizingLocal, setIsFinalizingLocal] = useState(false);

    const year = new Date().getFullYear();

    // Fetch Validasi 2 data only (provinces & submissions dari props)
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/pusdatin/penilaian/validasi-2/${year}`);
            const data = response.data?.data || response.data || [];
            setParsedData(data);
            setIsFinalized(Array.isArray(data) && data.length > 0 && data[0]?.status === 'finalized');
        } catch (err: unknown) {
            console.error('Error fetching data:', err);
            setParsedData([]);
            setIsFinalized(false);
        } finally {
            setLoading(false);
        }
    }, [year]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Filter parsed data (filter independen)
    const filteredParsed = useMemo(() => {
        return parsedData.filter(item => {
            const submission = submissions.find(s => s.id_dinas === item.id_dinas);
            if (!submission) return provinsiFilterParsed === '' && tipeFilterParsed === 'all' && statusFilterParsed === 'all';
            const matchTipe = tipeFilterParsed === 'all' || submission.tipe === tipeFilterParsed;
            const matchProvinsi = !provinsiFilterParsed || submission.provinsi === provinsiFilterParsed;
            const matchStatus = statusFilterParsed === 'all' || item.status_validasi === statusFilterParsed;
            return matchTipe && matchProvinsi && matchStatus;
        });
    }, [parsedData, submissions, tipeFilterParsed, provinsiFilterParsed, statusFilterParsed]);

    // Pagination untuk parsed (independen)
    const paginatedParsed = useMemo(() => {
        if (itemsPerPageParsed === 'all') return filteredParsed;
        const perPage = typeof itemsPerPageParsed === 'number' ? itemsPerPageParsed : 10;
        const start = (currentPageParsed - 1) * perPage;
        return filteredParsed.slice(start, start + perPage);
    }, [filteredParsed, currentPageParsed, itemsPerPageParsed]);

    // Handle checkbox change
    const handleCheckboxChange = async (id: number, field: 'Kriteria_WTP' | 'Kriteria_Kasus_Hukum', currentValue: boolean) => {
        if (isFinalized) {
            showToast('warning', 'Data sudah difinalisasi, tidak dapat diubah');
            return;
        }

        try {
            setUpdatingId(id);
            const item = parsedData.find(p => p.id === id);
            if (!item) return;

            const updatedData = {
                Kriteria_WTP: field === 'Kriteria_WTP' ? !currentValue : item.Kriteria_WTP,
                Kriteria_Kasus_Hukum: field === 'Kriteria_Kasus_Hukum' ? !currentValue : item.Kriteria_Kasus_Hukum
            };

            await axios.patch(`/api/pusdatin/penilaian/validasi-2/${id}/checklist`, updatedData);
            fetchData();
        } catch (err: unknown) {
            console.error('Error updating checklist:', err);
            showToast('error', getHttpErrorMessage(err, 'Gagal mengupdate checklist'));
        } finally {
            setUpdatingId(null);
        }
    };

    // Finalisasi
    const handleFinalize = async () => {
        try {
            setIsFinalizingLocal(true);
            await axios.post(`/api/pusdatin/penilaian/validasi-2/${year}/finalize`, {}, { timeout: 300000 });
            showToast('success', 'Validasi 2 berhasil difinalisasi');
            setShowConfirmModal(false);
            fetchData();
        } catch (err: unknown) {
            console.error('Error finalizing:', err);
            showToast('error', getHttpErrorMessage(err, 'Gagal memfinalisasi'));
        } finally {
            setIsFinalizingLocal(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <FaSpinner className="animate-spin text-green-600 text-3xl" />
                <span className="ml-3 text-gray-600">Memuat data...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filter Section */}
            <div className="flex flex-wrap gap-4 items-end">
                <div className="w-56">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Provinsi</label>
                    <select 
                        value={provinsiFilterParsed}
                        onChange={(e) => {
                            setProvinsiFilterParsed(e.target.value);
                            setCurrentPageParsed(1);
                        }}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                        <option value="">Semua Provinsi</option>
                        {provinsiList.map(prov => (
                            <option key={prov.id} value={prov.nama_region}>{prov.nama_region}</option>
                        ))}
                    </select>
                </div>
                <button
                    onClick={() => setCurrentPageParsed(1)}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                    Filter
                </button>
            </div>

            {/* Tabel Validasi 2 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                    <h3 className="font-bold text-gray-800">Tabel Validasi 2</h3>
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
                                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600">Nama DLH</th>
                                    <th className="py-3 px-4 text-center text-xs font-semibold text-gray-600">Total Skor</th>
                                    <th className="py-3 px-4 text-center text-xs font-semibold text-gray-600">Dokumen WTP</th>
                                    <th className="py-3 px-4 text-center text-xs font-semibold text-gray-600">Tidak tersangkut kasus hukum</th>
                                    <th className="py-3 px-4 text-center text-xs font-semibold text-gray-600">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedParsed.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-gray-500">
                                            {parsedData.length === 0 
                                                ? 'Belum ada data validasi 2. Pastikan Validasi 1 sudah difinalisasi.' 
                                                : 'Tidak ada data yang sesuai dengan filter'}
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedParsed.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="py-3 px-4 text-sm font-medium text-green-600 hover:underline cursor-pointer">
                                                {item.nama_dinas.replace('DLH ', '').replace('Dinas Lingkungan Hidup ', '')}
                                            </td>
                                            <td className="py-3 px-4 text-center text-sm text-gray-800">
                                                {Number(item.Total_Skor)?.toFixed(1) ?? '-'}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={item.Kriteria_WTP}
                                                    onChange={() => handleCheckboxChange(item.id, 'Kriteria_WTP', item.Kriteria_WTP)}
                                                    disabled={isFinalized || updatingId === item.id}
                                                    className="w-5 h-5 text-green-600 cursor-pointer disabled:cursor-not-allowed rounded"
                                                />
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={item.Kriteria_Kasus_Hukum}
                                                    onChange={() => handleCheckboxChange(item.id, 'Kriteria_Kasus_Hukum', item.Kriteria_Kasus_Hukum)}
                                                    disabled={isFinalized || updatingId === item.id}
                                                    className="w-5 h-5 text-green-600 cursor-pointer disabled:cursor-not-allowed rounded"
                                                />
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                    item.status_validasi === 'lolos' 
                                                        ? 'bg-green-100 text-green-600' 
                                                        : item.status_validasi === 'tidak_lolos'
                                                        ? 'bg-red-100 text-red-600'
                                                        : 'bg-yellow-100 text-yellow-600'
                                                }`}>
                                                    {item.status_validasi === 'lolos' ? 'Lolos' : item.status_validasi === 'tidak_lolos' ? 'Tidak Lolos' : 'Pending'}
                                                </span>
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
            {isFinalized ? (
                <div className="flex justify-end">
                    <FinalizedBadge />
                </div>
            ) : parsedData.length > 0 && (
                <div className="flex justify-end">
                    <button
                        onClick={() => setShowConfirmModal(true)}
                        className="bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                        <FaLock /> Finalisasi Validasi 2
                    </button>
                </div>
            )}

            {/* Confirmation Modal */}
            <ConfirmModal
                isOpen={showConfirmModal}
                title="Finalisasi Validasi 2"
                message="Apakah Anda yakin ingin memfinalisasi Validasi 2? Setelah difinalisasi, data tidak dapat diubah."
                confirmText="Ya, Finalisasi"
                cancelText="Batal"
                type="warning"
                onConfirm={handleFinalize}
                onCancel={() => setShowConfirmModal(false)}
                isLoading={isFinalizingLocal}
            />
        </div>
    );
}
