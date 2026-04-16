'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import axios from '@/lib/axios';
import { useToast, ConfirmModal, FinalizedBadge } from '@/components/ui';
import { FaFileExcel, FaCloudUploadAlt, FaSpinner, FaLock } from 'react-icons/fa';
import { getHttpErrorMessage } from './httpError';

import type {
    PenilaianPenghargaan,
    ParsedPenghargaan,
    TabProps
} from '@/types/penilaian';
// --- KOMPONEN TAB PENILAIAN PENGHARGAAN ---
export function TabPenilaianPenghargaan({ provinsiList, submissions }: TabProps) {
    const { showToast } = useToast();
    const [parsedData, setParsedData] = useState<ParsedPenghargaan[]>([]);
    const [penilaianPenghargaan, setPenilaianPenghargaan] = useState<PenilaianPenghargaan | null>(null);
    const [penilaianList, setPenilaianList] = useState<PenilaianPenghargaan[]>([]);
    const [selectedPenilaianId, setSelectedPenilaianId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadCatatan, setUploadCatatan] = useState('');
    const [currentPageParsed, setCurrentPageParsed] = useState(1);
    
    // Filter independen untuk hasil penilaian
    const tipeFilterParsed: 'all' | 'provinsi' | 'kabupaten/kota' = 'all';
    const [provinsiFilterParsed, setProvinsiFilterParsed] = useState<string>('');
    const itemsPerPageParsed: number | 'all' = 'all';
    
    // State untuk floating panel
    const [isPanelOpen, setIsPanelOpen] = useState(false);

    // Modal state
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isFinalizingLocal, setIsFinalizingLocal] = useState(false);

    const year = new Date().getFullYear();

    // Fetch Penghargaan penilaian data only (provinces & submissions dari props)
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const penilaianRes = await axios.get(`/api/pusdatin/penilaian/penghargaan/${year}`);
            
            const penilaianData = penilaianRes.data?.data || penilaianRes.data || [];
            if (penilaianData && penilaianData.length > 0) {
                setPenilaianList(penilaianData);
                const latestPenilaian = penilaianData[0];
                setPenilaianPenghargaan(latestPenilaian);
                setSelectedPenilaianId(latestPenilaian.id);
                // Fetch parsed data jika ada penilaian
                try {
                    const parsedRes = await axios.get(`/api/pusdatin/penilaian/penghargaan/parsed/${latestPenilaian.id}`);
                    setParsedData(parsedRes.data?.data || parsedRes.data || []);
                } catch (parseErr) {
                    console.error('Error fetching parsed data:', parseErr);
                    setParsedData([]);
                }
            } else {
                setPenilaianList([]);
                setPenilaianPenghargaan(null);
                setParsedData([]);
            }
        } catch (err) {
            console.error('Error fetching data:', err);
            setPenilaianList([]);
            setPenilaianPenghargaan(null);
            setParsedData([]);
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
            if (!submission) return provinsiFilterParsed === '' && tipeFilterParsed === 'all';
            const matchTipe = tipeFilterParsed === 'all' || submission.tipe === tipeFilterParsed;
            const matchProvinsi = !provinsiFilterParsed || submission.provinsi === provinsiFilterParsed;
            return matchTipe && matchProvinsi;
        });
    }, [parsedData, submissions, tipeFilterParsed, provinsiFilterParsed]);

    // Pagination untuk parsed (independen)
    const paginatedParsed = useMemo(() => {
        if (itemsPerPageParsed === 'all') return filteredParsed;
        const perPage = typeof itemsPerPageParsed === 'number' ? itemsPerPageParsed : 10;
        const start = (currentPageParsed - 1) * perPage;
        return filteredParsed.slice(start, start + perPage);
    }, [filteredParsed, currentPageParsed, itemsPerPageParsed]);

    // Handle penilaian selection change
    const handlePenilaianChange = async (penilaianId: number) => {
        const selected = penilaianList.find(p => p.id === penilaianId);
        if (!selected) return;
        
        setSelectedPenilaianId(penilaianId);
        setPenilaianPenghargaan(selected);
        setIsPanelOpen(false); // Tutup panel setelah memilih
        
        try {
            const parsedRes = await axios.get(`/api/pusdatin/penilaian/penghargaan/parsed/${penilaianId}`);
            setParsedData(parsedRes.data.data || []);
        } catch (err) {
            console.error('Error fetching parsed data:', err);
        }
    };

    // Download template
    const handleDownloadTemplate = async () => {
        try {
            const response = await axios.get(`/api/pusdatin/penilaian/penghargaan/template/${year}`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Template_Penilaian_Penghargaan_${year}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err: unknown) {
            console.error('Error downloading template:', err);
            const errorMsg = getHttpErrorMessage(err, 'Gagal mengunduh template. Pastikan penilaian SLHD sudah difinalisasi.');
            showToast('error', errorMsg);
        }
    };

    // Upload file
    const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        if (uploadCatatan) {
            formData.append('catatan', uploadCatatan);
        }

        try {
            setUploading(true);
            await axios.post(`/api/pusdatin/penilaian/penghargaan/upload/${year}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            showToast('success', 'File berhasil diupload dan sedang diproses');
            setUploadCatatan('');
            fetchData();
        } catch (err: unknown) {
            console.error('Error uploading file:', err);
            showToast('error', getHttpErrorMessage(err, 'Gagal mengupload file'));
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    // Finalisasi
    const handleFinalize = async () => {
        if (!penilaianPenghargaan) return;

        try {
            setIsFinalizingLocal(true);
            await axios.patch(`/api/pusdatin/penilaian/penghargaan/finalize/${penilaianPenghargaan.id}`, {}, { timeout: 300000 });
            showToast('success', 'Penilaian Penghargaan berhasil difinalisasi');
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
        <div className="space-y-8">
            {/* BAGIAN 1: DOWNLOAD & UPLOAD */}
            <div>
                <div className="pb-4 mb-6 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-800">Penilaian Penghargaan</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="border border-gray-200 rounded-xl p-6 bg-white">
                        <div className="flex items-center gap-2 mb-2 text-green-600">
                            <FaFileExcel className="text-xl" />
                            <h3 className="font-semibold text-gray-800">Unduh Template Excel</h3>
                        </div>
                        <p className="text-xs text-gray-500 mb-4">
                            Silahkan unduh template excel, isi nilai, dan unggah kembali ke sistem.
                        </p>
                        <button 
                            onClick={handleDownloadTemplate}
                            className="w-full bg-green-600 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-green-700 transition-colors"
                        >
                            <FaFileExcel /> Unduh Template Excel Penilaian Penghargaan
                        </button>
                    </div>

                    <div className="border border-gray-200 rounded-xl p-6 bg-white">
                        <div className="flex items-center gap-2 mb-2 text-green-600">
                            <FaCloudUploadAlt className="text-xl" />
                            <h3 className="font-semibold text-gray-800">Upload File Excel</h3>
                        </div>
                        <p className="text-xs text-gray-500 mb-4">
                            Pastikan file yang diunggah sudah sesuai dengan template yang disediakan.
                        </p>
                        
                        {/* Input Catatan */}
                        <div className="mb-4">
                            <label className="block text-xs font-semibold text-gray-600 mb-1">
                                Catatan Upload (Opsional)
                            </label>
                            <input
                                type="text"
                                placeholder="Contoh: Revisi 2, Update nilai Adipura, dll..."
                                value={uploadCatatan}
                                onChange={(e) => setUploadCatatan(e.target.value)}
                                disabled={uploading || penilaianPenghargaan?.status === 'finalized'}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                            />
                        </div>

                        <label className={`w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                            uploading || penilaianPenghargaan?.status === 'finalized'
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}>
                            {uploading ? (
                                <>
                                    <FaSpinner className="animate-spin" /> Mengupload...
                                </>
                            ) : (
                                <>
                                    <FaCloudUploadAlt /> Upload File Excel Hasil Penilaian Penghargaan
                                </>
                            )}
                            <input
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleUploadFile}
                                disabled={uploading || penilaianPenghargaan?.status === 'finalized'}
                                className="hidden"
                            />
                        </label>
                    </div>
                </div>

                {/* Status Info */}
                <div className="pb-4 mb-6 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-800">Hasil Penilaian Penghargaan</h2>
                    {penilaianPenghargaan && (
                        <p className="text-sm text-gray-500 mt-1">
                            Status: <span className={penilaianPenghargaan.is_finalized ? 'text-green-600 font-medium' : 'text-yellow-600 font-medium'}>
                                {penilaianPenghargaan.is_finalized ? '🔒 Sudah Finalisasi' : '📝 Draft'}
                            </span>
                        </p>
                    )}
                </div>
                
                {/* Button untuk membuka panel pilih versi penilaian */}
                {penilaianList.length > 0 && !isPanelOpen && (
                    <div className="mb-6">
                        <button
                            onClick={() => setIsPanelOpen(true)}
                            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 p-2 rounded-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div className="text-left">
                                    <p className="text-lg font-bold">Pilih Versi Penilaian</p>
                                    <p className="text-xs text-green-100">Klik untuk melihat {penilaianList.length} versi penilaian yang tersedia</p>
                                </div>
                            </div>
                            <div className="bg-white/20 p-2 rounded-lg group-hover:bg-white/30 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </button>
                    </div>
                )}

                {/* Floating Card untuk Pilih Versi Penilaian */}
                {penilaianList.length > 0 && isPanelOpen && (
                    <div className="bg-gradient-to-br from-green-50 to-white border border-green-200 rounded-2xl shadow-lg p-6 mb-6 animate-fade-in">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3 flex-1">
                                <div className="bg-green-100 p-3 rounded-xl">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 text-lg">Pilih Versi Penilaian</h3>
                                    <p className="text-xs text-gray-500">Pilih versi hasil penilaian penghargaan yang ingin ditampilkan</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {penilaianPenghargaan?.is_finalized && <FinalizedBadge />}
                                <button
                                    onClick={() => setIsPanelOpen(false)}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-lg transition-colors"
                                    title="Tutup panel"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {penilaianList.map((p, idx) => {
                                const uploadDate = new Date(p.uploaded_at);
                                const tanggal = uploadDate.toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                });
                                const waktu = uploadDate.toLocaleTimeString('id-ID', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                });
                                const uploaderEmail = p.uploaded_by?.email || '-';
                                const catatan = p.catatan || 'Tanpa catatan khusus';
                                const isSelected = selectedPenilaianId === p.id;
                                const isLocked = penilaianPenghargaan?.is_finalized && !isSelected;
                                
                                return (
                                    <button
                                        key={p.id}
                                        onClick={() => !isLocked && handlePenilaianChange(p.id)}
                                        disabled={isLocked}
                                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                                            isSelected
                                                ? 'border-green-500 bg-green-50 shadow-md'
                                                : isLocked
                                                    ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                                                    : 'border-gray-200 bg-white hover:border-green-300 hover:shadow-sm'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`text-sm font-bold ${isSelected ? 'text-green-700' : 'text-gray-700'}`}>
                                                        Versi #{penilaianList.length - idx}
                                                    </span>
                                                    {p.is_finalized && (
                                                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-semibold flex items-center gap-1">
                                                            <FaLock className="text-[10px]" /> Finalized
                                                        </span>
                                                    )}
                                                    {isSelected && (
                                                        <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
                                                            Aktif
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-2">
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-0.5">📅 Tanggal Upload</p>
                                                        <p className="text-sm font-medium text-gray-700">{tanggal}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-0.5">🕐 Waktu</p>
                                                        <p className="text-sm font-medium text-gray-700">{waktu} WIB</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-0.5">👤 Diupload Oleh</p>
                                                        <p className="text-xs text-gray-400">{uploaderEmail}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-0.5">📝 Catatan</p>
                                                        <p className="text-sm font-medium text-gray-700 italic">{catatan}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {isSelected && (
                                                <div className="flex-shrink-0">
                                                    <div className="bg-green-500 rounded-full p-1">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* BAGIAN 2: TABEL HASIL PENILAIAN */}
            <div className="space-y-4">
                {/* Filter Independen untuk Hasil Penilaian */}
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
                
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200">
                        <h3 className="font-bold text-gray-800">Tabel Penilaian Penghargaan</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600">Nama DLH</th>
                                    <th className="py-3 px-4 text-center text-xs font-semibold text-gray-600">Adipura</th>
                                    <th className="py-3 px-4 text-center text-xs font-semibold text-gray-600">Adiwiyata</th>
                                    <th className="py-3 px-4 text-center text-xs font-semibold text-gray-600">Proklim</th>
                                    <th className="py-3 px-4 text-center text-xs font-semibold text-gray-600">Proper</th>
                                    <th className="py-3 px-4 text-center text-xs font-semibold text-gray-600">Kalpataru</th>
                                    <th className="py-3 px-4 text-center text-xs font-semibold text-gray-600">Nilai Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedParsed.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-8 text-center text-gray-500">
                                            {parsedData.length === 0 
                                                ? 'Belum ada hasil penilaian. Silakan upload file excel penilaian.' 
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
                                                {item.Adipura_Skor !== null ? item.Adipura_Skor : '-'}
                                            </td>
                                            <td className="py-3 px-4 text-center text-sm text-gray-800">
                                                {item.Adiwiyata_Skor !== null ? item.Adiwiyata_Skor : '-'}
                                            </td>
                                            <td className="py-3 px-4 text-center text-sm text-gray-800">
                                                {item.Proklim_Skor !== null ? item.Proklim_Skor : '-'}
                                            </td>
                                            <td className="py-3 px-4 text-center text-sm text-gray-800">
                                                {item.Proper_Skor !== null ? item.Proper_Skor : '-'}
                                            </td>
                                            <td className="py-3 px-4 text-center text-sm text-gray-800">
                                                {item.Kalpataru_Skor !== null ? item.Kalpataru_Skor : '-'}
                                            </td>
                                            <td className="py-3 px-4 text-center text-sm font-bold text-gray-800">
                                                {item.Total_Skor?.toFixed(1) ?? '-'}
                                                
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Tombol Finalisasi */}
                {penilaianPenghargaan?.is_finalized ? (
                    <div className="flex justify-end">
                        <FinalizedBadge />
                    </div>
                ) : penilaianPenghargaan && parsedData.length > 0 && (
                    <div className="flex justify-end">
                        <button
                            onClick={() => setShowConfirmModal(true)}
                            className="bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                        >
                            <FaLock /> Finalisasi Penilaian Penghargaan
                        </button>
                    </div>
                )}
            </div>

            {/* Confirmation Modal */}
            <ConfirmModal
                isOpen={showConfirmModal}
                title="Finalisasi Penilaian Penghargaan"
                message="Apakah Anda yakin ingin memfinalisasi penilaian Penghargaan? Setelah difinalisasi, data tidak dapat diubah."
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
