'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import axios from '@/lib/axios';
import { useToast, ConfirmModal, FinalizedBadge } from '@/components/ui';
import { FaFileExcel, FaCloudUploadAlt, FaSpinner, FaLock, FaSyncAlt } from 'react-icons/fa';
import { MdCheckBox, MdCheckBoxOutlineBlank } from 'react-icons/md';
import { getHttpErrorMessage } from './httpError';

import type {
    ParsedSLHD,
    PenilaianSLHD,
    TabProps
} from '@/types/penilaian';
import { getBab2Avg } from '@/types/penilaian';
// --- KOMPONEN TAB PENILAIAN SLHD ---
export function TabPenilaianSLHD({ provinsiList, submissions, onRefreshSubmissions }: TabProps) {
    const { showToast } = useToast();
    const [tipeFilter, setTipeFilter] = useState<'all' | 'provinsi' | 'kabupaten/kota'>('all');
    const [provinsiFilter, setProvinsiFilter] = useState<string>('');
    const [parsedData, setParsedData] = useState<ParsedSLHD[]>([]);
    const [penilaianSLHD, setPenilaianSLHD] = useState<PenilaianSLHD | null>(null);
    const [penilaianList, setPenilaianList] = useState<PenilaianSLHD[]>([]);
    const [selectedPenilaianId, setSelectedPenilaianId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadCatatan, setUploadCatatan] = useState('');
    const [itemsPerPage, setItemsPerPage] = useState<number | 'all'>(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [currentPageParsed, setCurrentPageParsed] = useState(1);
    
    // Filter independen untuk hasil penilaian
    const [tipeFilterParsed, setTipeFilterParsed] = useState<'all' | 'provinsi' | 'kabupaten/kota'>('all');
    const [provinsiFilterParsed, setProvinsiFilterParsed] = useState<string>('');
    const [itemsPerPageParsed, setItemsPerPageParsed] = useState<number | 'all'>(10);
    
    // State untuk floating panel
    const [isPanelOpen, setIsPanelOpen] = useState(false);

    // Modal state
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isFinalizingLocal, setIsFinalizingLocal] = useState(false);

    const year = new Date().getFullYear();

    // Fetch SLHD penilaian data only (provinces & submissions dari props)
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const penilaianRes = await axios.get(`/api/pusdatin/penilaian/slhd/${year}`);
            
            // Backend mengembalikan array semua penilaian SLHD
            const penilaianData = penilaianRes.data?.data || penilaianRes.data || [];
            if (penilaianData && penilaianData.length > 0) {
                setPenilaianList(penilaianData);
                const latestPenilaian = penilaianData[0];
                setPenilaianSLHD(latestPenilaian);
                setSelectedPenilaianId(latestPenilaian.id);
                // Fetch parsed data jika ada penilaian
                try {
                    const parsedRes = await axios.get(`/api/pusdatin/penilaian/slhd/parsed/${latestPenilaian.id}`);
                    setParsedData(parsedRes.data?.data || parsedRes.data || []);
                } catch (parseErr) {
                    console.error('Error fetching parsed data:', parseErr);
                    setParsedData([]);
                }
            } else {
                setPenilaianList([]);
                setPenilaianSLHD(null);
                setParsedData([]);
            }
        } catch (err) {
            console.error('Error fetching data:', err);
            setPenilaianList([]);
            setPenilaianSLHD(null);
            setParsedData([]);
        } finally {
            setLoading(false);
        }
    }, [year]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Filter submissions
    const filteredSubmissions = useMemo(() => {
        return submissions.filter(item => {
            const matchTipe = tipeFilter === 'all' || item.tipe === tipeFilter;
            const matchProvinsi = !provinsiFilter || item.provinsi === provinsiFilter;
            return matchTipe && matchProvinsi;
        });
    }, [submissions, tipeFilter, provinsiFilter]);

    // Filter parsed data (filter independen)
    const filteredParsed = useMemo(() => {
        return parsedData.filter(item => {
            // Cari submission untuk dinas ini
            const submission = submissions.find(s => s.id_dinas === item.id_dinas);
            
            // Jika submission tidak ketemu, skip filter ini (tampilkan data)
            if (!submission) return provinsiFilterParsed === '' && tipeFilterParsed === 'all';
            
            // Match tipe
            const matchTipe = tipeFilterParsed === 'all' || submission.tipe === tipeFilterParsed;
            
            // Match provinsi (ambil dari submission, bukan dari item)
            const matchProvinsi = !provinsiFilterParsed || submission.provinsi === provinsiFilterParsed;
            
            return matchTipe && matchProvinsi;
        });
    }, [parsedData, submissions, tipeFilterParsed, provinsiFilterParsed]);

    // Pagination untuk submissions
    const paginatedSubmissions = useMemo(() => {
        if (itemsPerPage === 'all') return filteredSubmissions;
        const start = (currentPage - 1) * itemsPerPage;
        return filteredSubmissions.slice(start, start + itemsPerPage);
    }, [filteredSubmissions, currentPage, itemsPerPage]);

    // Pagination untuk parsed (independen)
    const paginatedParsed = useMemo(() => {
        if (itemsPerPageParsed === 'all') return filteredParsed;
        const perPage = typeof itemsPerPageParsed === 'number' ? itemsPerPageParsed : 10;
        const start = (currentPageParsed - 1) * perPage;
        return filteredParsed.slice(start, start + perPage);
    }, [filteredParsed, currentPageParsed, itemsPerPageParsed]);

    const totalPagesSubmissions = itemsPerPage === 'all' ? 1 : Math.ceil(filteredSubmissions.length / itemsPerPage);
    const totalPagesParsed = itemsPerPageParsed === 'all' ? 1 : Math.ceil(filteredParsed.length / (typeof itemsPerPageParsed === 'number' ? itemsPerPageParsed : 10));

    // Handle penilaian selection change
    const handlePenilaianChange = async (penilaianId: number) => {
        const selected = penilaianList.find(p => p.id === penilaianId);
        if (!selected) return;
        
        setSelectedPenilaianId(penilaianId);
        setPenilaianSLHD(selected);
        setIsPanelOpen(false); // Tutup panel setelah memilih
        
        try {
            const parsedRes = await axios.get(`/api/pusdatin/penilaian/slhd/parsed/${penilaianId}`);
            setParsedData(parsedRes.data.data || []);
        } catch (err) {
            console.error('Error fetching parsed data:', err);
        }
    };

    // Download template
    const handleDownloadTemplate = async () => {
        try {
            const response = await axios.get(`/api/pusdatin/penilaian/slhd/template?year=${year}&tipe=${tipeFilter === 'all' ? 'kabupaten/kota' : tipeFilter}`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Template_Penilaian_SLHD_${year}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error('Error downloading template:', err);
            showToast('error', 'Gagal mengunduh template');
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
            await axios.post(`/api/pusdatin/penilaian/slhd/upload/${year}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            showToast('success', 'File berhasil diupload dan sedang diproses');
            setUploadCatatan(''); // Reset catatan
            fetchData(); // Refresh data
        } catch (err: unknown) {
            console.error('Error uploading file:', err);
            showToast('error', getHttpErrorMessage(err, 'Gagal mengupload file'));
        } finally {
            setUploading(false);
            e.target.value = ''; // Reset input
        }
    };

    // Finalisasi
    const handleFinalize = async () => {
        if (!penilaianSLHD) return;
        
        try {
            setIsFinalizingLocal(true);
            await axios.patch(`/api/pusdatin/penilaian/slhd/finalize/${penilaianSLHD.id}`, {}, { timeout: 300000 });
            showToast('success', 'Penilaian SLHD berhasil difinalisasi');
            setShowConfirmModal(false);
            fetchData();
        } catch (err: unknown) {
            console.error('Error finalizing:', err);
            showToast('error', getHttpErrorMessage(err, 'Gagal memfinalisasi'));
        } finally {
            setIsFinalizingLocal(false);
        }
    };

    // Helper: Keterangan Lulus/Tidak Lulus
    const getKeterangan = (totalSkor: number | null) => {
        if (totalSkor === null) return '-';
        return totalSkor >= 60 ? 'Lulus' : 'Tidak Lulus';
    };

    const getKeteranganColor = (totalSkor: number | null) => {
        if (totalSkor === null) return 'text-gray-400';
        return totalSkor >= 60 ? 'text-green-600' : 'text-red-600';
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
            {/* BAGIAN 1: FILTER & TABEL KELAYAKAN ADMINISTRASI */}
            <div>
                <div className="pb-4 mb-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-800">Kelayakan Administrasi Dokumen</h2>
                    {onRefreshSubmissions && (
                        <button
                            onClick={onRefreshSubmissions}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                            title="Refresh data kelayakan"
                        >
                            <FaSyncAlt className="text-sm" />
                            Refresh
                        </button>
                    )}
                </div>

                {/* Filter */}
                <div className="flex flex-wrap gap-4 mb-6 items-end">
                    <div className="w-48">
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Tipe Daerah</label>
                        <select 
                            value={tipeFilter}
                            onChange={(e) => {
                                setTipeFilter(e.target.value as 'all' | 'provinsi' | 'kabupaten/kota');
                                setCurrentPage(1);
                                setCurrentPageParsed(1);
                            }}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                            <option value="all">Semua</option>
                            <option value="provinsi">Provinsi</option>
                            <option value="kabupaten/kota">Kabupaten/Kota</option>
                        </select>
                    </div>
                    <div className="w-64">
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Provinsi</label>
                        <select 
                            value={provinsiFilter}
                            onChange={(e) => {
                                setProvinsiFilter(e.target.value);
                                setCurrentPage(1);
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
                    <div className="w-32">
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Tampilkan</label>
                        <select 
                            value={itemsPerPage === 'all' ? 'all' : itemsPerPage.toString()}
                            onChange={(e) => {
                                const val = e.target.value;
                                setItemsPerPage(val === 'all' ? 'all' : parseInt(val));
                                setCurrentPage(1);
                                setCurrentPageParsed(1);
                            }}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                            <option value="all">Semua</option>
                            <option value="10">10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </select>
                    </div>
                </div>

                {/* Tabel Administrasi */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-green-100">
                                <tr>
                                    <th className="py-3 px-4 text-left text-xs font-bold text-gray-700 uppercase">No</th>
                                    <th className="py-3 px-4 text-left text-xs font-bold text-gray-700 uppercase">Nama DLH</th>
                                    {/* <th className="py-3 px-4 text-left text-xs font-bold text-gray-700 uppercase">Tipe</th> */}
                                    {/* <th className="py-3 px-4 text-left text-xs font-bold text-gray-700 uppercase">Aksi</th> */}
                                    <th className="py-3 px-4 text-center text-xs font-bold text-gray-700 uppercase">Buku I</th>
                                    <th className="py-3 px-4 text-center text-xs font-bold text-gray-700 uppercase">Buku II</th>
                                    <th className="py-3 px-4 text-center text-xs font-bold text-gray-700 uppercase">Buku III</th>
                                    <th className="py-3 px-4 text-center text-xs font-bold text-gray-700 uppercase">Tabel Utama</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {paginatedSubmissions.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-8 text-center text-gray-500">
                                            Tidak ada data submission
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedSubmissions.map((item, index) => (
                                        <tr key={item.id_dinas} className="hover:bg-gray-50">
                                            <td className="py-3 px-4 text-sm text-gray-600">
                                                {itemsPerPage === 'all' ? index + 1 : (currentPage - 1) * itemsPerPage + index + 1}
                                            </td>
                                            <td className="py-3 px-4 text-sm font-medium text-gray-800">{item.nama_dinas}</td>
                                            {/* <td className="py-3 px-4 text-sm text-gray-600 capitalize">{item.tipe}</td> */}
                                            {/* <td className="py-3 px-4 text-sm">
                                                <a 
                                                    href={`/pusdatin-dashboard/submission/${item.id_dinas}`}
                                                    className="text-green-600 hover:underline text-xs font-medium"
                                                >
                                                    Lihat Dokumen
                                                </a>
                                            </td> */}
                                            <td className="py-3 px-4 text-center text-xl">
                                                {item.buku1_status === 'approved' ? (
                                                    <MdCheckBox className="inline text-green-600" />
                                                ) : (
                                                    <MdCheckBoxOutlineBlank className="inline text-gray-300" />
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-center text-xl">
                                                {item.buku2_status === 'approved' ? (
                                                    <MdCheckBox className="inline text-green-600" />
                                                ) : (
                                                    <MdCheckBoxOutlineBlank className="inline text-gray-300" />
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-center text-xl">
                                                {item.buku3_status === 'approved' ? (
                                                    <MdCheckBox className="inline text-green-600" />
                                                ) : (
                                                    <MdCheckBoxOutlineBlank className="inline text-gray-300" />
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-center text-xl">
                                                {item.tabel_status === 'finalized' ? (
                                                    <MdCheckBox className="inline text-green-600" />
                                                ) : (
                                                    <MdCheckBoxOutlineBlank className="inline text-gray-300" />
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Info & Pagination Administrasi */}
                <div className="mt-4 flex justify-between items-center">
                    <div className="text-sm text-gray-700">
                        Menampilkan {paginatedSubmissions.length} dari {filteredSubmissions.length} data
                    </div>
                    {itemsPerPage !== 'all' && totalPagesSubmissions > 1 && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                            >
                                Prev
                            </button>
                            <span className="px-3 py-1 text-sm">
                                {currentPage} / {totalPagesSubmissions}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPagesSubmissions, p + 1))}
                                disabled={currentPage === totalPagesSubmissions}
                                className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* BAGIAN 2: TOMBOL DOWNLOAD & UPLOAD */}
            <div>
                 <div>
                        <h2 className="text-lg font-bold text-gray-800">Penilaian SLHD</h2>
                        {penilaianSLHD && (
                            <p className="text-sm text-gray-500 mt-1">
                                Status: <span className={penilaianSLHD.is_finalized ? 'text-green-600 font-medium' : 'text-yellow-600 font-medium'}>
                                    {penilaianSLHD.is_finalized ? '🔒 Sudah Finalisasi' : '📝 Draft'}
                                </span>
                            </p>
                        )}
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
                            <FaFileExcel /> Unduh Template Excel Penilaian SLHD
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
                                placeholder="Contoh: Revisi 2, Update nilai BAB 3, dll..."
                                value={uploadCatatan}
                                onChange={(e) => setUploadCatatan(e.target.value)}
                                disabled={uploading || penilaianSLHD?.status === 'finalized'}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                            />
                        </div>

                        <label className={`w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                            uploading || penilaianSLHD?.status === 'finalized'
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}>
                            {uploading ? (
                                <>
                                    <FaSpinner className="animate-spin" /> Mengupload...
                                </>
                            ) : (
                                <>
                                    <FaCloudUploadAlt /> Upload File Excel Hasil Penilaian SLHD
                                </>
                            )}
                            <input
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleUploadFile}
                                disabled={uploading || penilaianSLHD?.status === 'finalized'}
                                className="hidden"
                            />
                        </label>
                    </div>
                </div>
                
            </div>

            {/* BAGIAN 3: TABEL HASIL PENILAIAN */}
            <div>
                <div className="pb-4 mb-6 border-b border-gray-200">
                    <h3 className="font-bold text-gray-800">Hasil Penilaian</h3>
                </div>

                {/* Filter Independen untuk Hasil Penilaian */}
                <div className="flex flex-wrap gap-4 mb-6 items-end">
                    <div className="w-48">
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Tipe Daerah</label>
                        <select 
                            value={tipeFilterParsed}
                            onChange={(e) => {
                                const val = e.target.value as 'all' | 'provinsi' | 'kabupaten/kota';
                                setTipeFilterParsed(val);
                                setCurrentPageParsed(1);
                            }}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                            <option value="all">Semua</option>
                            <option value="provinsi">Provinsi</option>
                            <option value="kabupaten/kota">Kabupaten/Kota</option>
                        </select>
                    </div>
                    <div className="w-64">
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
                    <div className="w-32">
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Tampilkan</label>
                        <select 
                            value={itemsPerPageParsed === 'all' ? 'all' : itemsPerPageParsed.toString()}
                            onChange={(e) => {
                                const val = e.target.value;
                                setItemsPerPageParsed(val === 'all' ? 'all' : parseInt(val));
                                setCurrentPageParsed(1);
                            }}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                            <option value="all">Semua</option>
                            <option value="10">10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </select>
                    </div>
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
                            <div className="flex items-center gap-3">
                                <div className="bg-green-100 p-3 rounded-xl">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 text-lg">Pilih Versi Penilaian</h3>
                                    <p className="text-xs text-gray-500">Pilih versi hasil penilaian SLHD yang ingin ditampilkan</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {penilaianSLHD?.is_finalized && <FinalizedBadge />}
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
                                // const uploaderName = p.uploaded_by?.name || 'Unknown User';
                                const uploaderEmail = p.uploaded_by?.email || '-';
                                const catatan = p.catatan || 'Tanpa catatan khusus';
                                const isSelected = selectedPenilaianId === p.id;
                                const isLocked = penilaianSLHD?.is_finalized && !isSelected;
                                
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
                                                        {/* <p className="text-sm font-medium text-gray-700">{uploaderName}</p> */}
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

                {/* BAGIAN 3: TABEL HASIL PENILAIAN */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-green-100">
                                <tr>
                                    <th className="py-3 px-3 text-left text-xs font-bold text-gray-700 uppercase">No</th>
                                    <th className="py-3 px-3 text-left text-xs font-bold text-gray-700 uppercase">Nama DLH</th>
                                    <th className="py-3 px-3 text-center text-xs font-bold text-gray-700 uppercase">BAB I</th>
                                    <th className="py-3 px-3 text-center text-xs font-bold text-gray-700 uppercase">BAB II</th>
                                    <th className="py-3 px-3 text-center text-xs font-bold text-gray-700 uppercase">BAB III</th>
                                    <th className="py-3 px-3 text-center text-xs font-bold text-gray-700 uppercase">BAB IV</th>
                                    <th className="py-3 px-3 text-center text-xs font-bold text-gray-700 uppercase">BAB V</th>
                                    <th className="py-3 px-3 text-center text-xs font-bold text-gray-700 uppercase">Total Skor</th>
                                    <th className="py-3 px-3 text-center text-xs font-bold text-gray-700 uppercase">Keterangan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {paginatedParsed.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="py-8 text-center text-gray-500">
                                            {parsedData.length === 0 
                                                ? 'Belum ada hasil penilaian. Silakan upload file excel penilaian.' 
                                                : 'Tidak ada data yang sesuai dengan filter'}
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedParsed.map((item, index) => {
                                        const bab2Avg = getBab2Avg(item);
                                        return (
                                            <tr key={item.id} className="hover:bg-gray-50">
                                                <td className="py-3 px-3 text-sm text-gray-600">
                                                    {itemsPerPageParsed === 'all' ? index + 1 : (currentPageParsed - 1) * (typeof itemsPerPageParsed === 'number' ? itemsPerPageParsed : 10) + index + 1}
                                                </td>
                                                <td className="py-3 px-3 text-sm font-medium text-gray-800">{item.nama_dinas}</td>
                                                <td className="py-3 px-3 text-center text-sm text-gray-600">{item.Bab_1 ?? '-'}</td>
                                                <td className="py-3 px-3 text-center text-sm text-gray-600">{bab2Avg?.toFixed(1) ?? '-'}</td>
                                                <td className="py-3 px-3 text-center text-sm text-gray-600">{item.Bab_3 ?? '-'}</td>
                                                <td className="py-3 px-3 text-center text-sm text-gray-600">{item.Bab_4 ?? '-'}</td>
                                                <td className="py-3 px-3 text-center text-sm text-gray-600">{item.Bab_5 ?? '-'}</td>
                                                <td className="py-3 px-3 text-center text-sm font-bold text-gray-800">
                                                    {item.Total_Skor?.toFixed(2) ?? '-'}
                                                </td>
                                                <td className={`py-3 px-3 text-center text-sm font-semibold ${getKeteranganColor(item.Total_Skor)}`}>
                                                    {getKeterangan(item.Total_Skor)}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Info & Pagination Hasil Penilaian */}
                <div className="mt-4 flex justify-between items-center">
                    <div className="text-sm text-gray-700">
                        Menampilkan {paginatedParsed.length} dari {filteredParsed.length} data
                    </div>
                    {itemsPerPageParsed !== 'all' && totalPagesParsed > 1 && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPageParsed(p => Math.max(1, p - 1))}
                                disabled={currentPageParsed === 1}
                                className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                            >
                                Prev
                            </button>
                            <span className="px-3 py-1 text-sm">
                                {currentPageParsed} / {totalPagesParsed}
                            </span>
                            <button
                                onClick={() => setCurrentPageParsed(p => Math.min(totalPagesParsed, p + 1))}
                                disabled={currentPageParsed === totalPagesParsed}
                                className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>

            </div>

            {/* BAGIAN 4: TOMBOL FINALISASI DI BAWAH */}
            {penilaianSLHD && !penilaianSLHD.is_finalized && parsedData.length > 0 && (
                <div className="flex justify-end pt-4 border-t border-gray-200">
                    <button
                        onClick={() => setShowConfirmModal(true)}
                        className="bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                        <FaLock /> Finalisasi Penilaian SLHD
                    </button>
                </div>
            )}

            {/* Confirmation Modal */}
            <ConfirmModal
                isOpen={showConfirmModal}
                title="Finalisasi Penilaian SLHD"
                message="Apakah Anda yakin ingin memfinalisasi penilaian SLHD? Setelah difinalisasi, data tidak dapat diubah dan versi penilaian akan terkunci."
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
