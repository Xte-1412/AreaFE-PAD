'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import axios from '@/lib/axios';
import { useToast, ConfirmModal, FinalizedBadge } from '@/components/ui';
import { FaCheckCircle, FaSpinner, FaFilter, FaLock, FaUsers } from 'react-icons/fa';
import { getHttpErrorMessage } from './httpError';

import type {
    PenilaianRekap,
    WawancaraData
} from '@/types/penilaian';
// --- KOMPONEN TAB WAWANCARA ---

const normalizeRekapData = (payload: unknown): PenilaianRekap | null => {
    if (!payload || typeof payload !== 'object') {
        return null;
    }

    const data = payload as Partial<PenilaianRekap>;

    return {
        nilai_slhd: typeof data.nilai_slhd === 'number' ? data.nilai_slhd : null,
        nilai_penghargaan: typeof data.nilai_penghargaan === 'number' ? data.nilai_penghargaan : null,
        lolos_validasi1: typeof data.lolos_validasi1 === 'boolean' ? data.lolos_validasi1 : null,
        lolos_validasi2: typeof data.lolos_validasi2 === 'boolean' ? data.lolos_validasi2 : null,
    };
};

export function TabWawancara() {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [wawancaraData, setWawancaraData] = useState<WawancaraData[]>([]);
    const [selectedKategori, setSelectedKategori] = useState<string>('');
    const [selectedDinas, setSelectedDinas] = useState<number | null>(null);
    const [currentDinasData, setCurrentDinasData] = useState<WawancaraData | null>(null);
    const [isFinalized, setIsFinalized] = useState(false);
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [rekapData, setRekapData] = useState<PenilaianRekap | null>(null);
    const [loadingRekap, setLoadingRekap] = useState(false);
    const [inputValue, setInputValue] = useState<string>('');

    // Modal state
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isFinalizingLocal, setIsFinalizingLocal] = useState(false);

    const year = new Date().getFullYear();

    const kategoriOptions = [
        { value: '', label: '-- Pilih Jenis DLH --' },
        { value: 'provinsi', label: 'Provinsi' },
        { value: 'kabupaten_besar', label: 'Kabupaten Besar' },
        { value: 'kabupaten_sedang', label: 'Kabupaten Sedang' },
        { value: 'kabupaten_kecil', label: 'Kabupaten Kecil' },
        { value: 'kota_besar', label: 'Kota Besar' },
        { value: 'kota_sedang', label: 'Kota Sedang' },
        { value: 'kota_kecil', label: 'Kota Kecil' },
    ];

    // Fetch wawancara data (all for dropdown)
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/pusdatin/penilaian/wawancara/${year}`);
            const data = response.data?.data || response.data || [];
            setWawancaraData(data);
            setIsFinalized(Array.isArray(data) && data.length > 0 && data[0]?.is_finalized || false);
        } catch (err: unknown) {
            console.error('Error fetching data:', err);
            setWawancaraData([]);
            setIsFinalized(false);
        } finally {
            setLoading(false);
        }
    }, [year]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Filter dinas berdasarkan kategori
    const filteredDinasOptions = useMemo(() => {
        if (!selectedKategori) return [];
        return wawancaraData.filter(d => d.kategori === selectedKategori);
    }, [wawancaraData, selectedKategori]);

    // Update current dinas when selection changes
    useEffect(() => {
        if (selectedDinas) {
            const dinas = wawancaraData.find(d => d.id === selectedDinas);
            setCurrentDinasData(dinas || null);
            setInputValue(dinas?.nilai_wawancara?.toString() ?? '');
        } else {
            setCurrentDinasData(null);
            setInputValue('');
        }
    }, [selectedDinas, wawancaraData]);

    // Fetch rekap when dinas is selected
    const fetchRekap = useCallback(async (idDinas: number) => {
        try {
            setLoadingRekap(true);
            const response = await axios.get(`/api/pusdatin/penilaian/rekap/${year}/dinas/${idDinas}`);
            const payload = response.data?.data ?? response.data;
            setRekapData(normalizeRekapData(payload));
        } catch (err: unknown) {
            console.error('Error fetching rekap:', err);
            setRekapData(null);
        } finally {
            setLoadingRekap(false);
        }
    }, [year]);

    // Fetch rekap when dinas changes
    useEffect(() => {
        if (currentDinasData) {
            fetchRekap(currentDinasData.id_dinas);
        } else {
            setRekapData(null);
        }
    }, [currentDinasData, fetchRekap]);

    // Calculate nilai NT Final (90% SLHD + 10% wawancara)
    const nilaiNTFinal = useMemo(() => {
        if (!rekapData || !currentDinasData) return null;
        // Use nilai_slhd as base (90%)
        const nilaiSLHD = rekapData.nilai_slhd || 0;
        const nilaiWawancara = currentDinasData.nilai_wawancara || 0;
        // Formula: 90% nilaiSLHD + 10% nilaiWawancara
        return (nilaiSLHD * 0.9) + (nilaiWawancara * 0.1);
    }, [rekapData, currentDinasData]);

    // Update nilai wawancara
    const handleUpdateNilai = async () => {
        if (!currentDinasData) return;
        if (isFinalized) {
            showToast('warning', 'Data sudah difinalisasi, tidak dapat diubah');
            return;
        }

        const nilaiNum = parseFloat(inputValue);
        if (isNaN(nilaiNum) || nilaiNum < 0 || nilaiNum > 100) {
            showToast('error', 'Nilai harus antara 0-100');
            setInputValue(currentDinasData.nilai_wawancara?.toString() ?? '');
            return;
        }

        try {
            setUpdatingId(currentDinasData.id);
            await axios.patch(`/api/pusdatin/penilaian/wawancara/${currentDinasData.id}/nilai`, {
                nilai_wawancara: nilaiNum
            });
            showToast('success', 'Nilai wawancara berhasil disimpan');
            await fetchData();
        } catch (err: unknown) {
            console.error('Error updating nilai:', err);
            showToast('error', getHttpErrorMessage(err, 'Gagal mengupdate nilai'));
            setInputValue(currentDinasData.nilai_wawancara?.toString() ?? '');
        } finally {
            setUpdatingId(null);
        }
    };

    // Finalisasi
    const handleFinalize = async () => {
        try {
            setIsFinalizingLocal(true);
            await axios.patch(`/api/pusdatin/penilaian/wawancara/${year}/finalize`, {}, { timeout: 300000 });
            showToast('success', 'Hasil wawancara berhasil difinalisasi. Nilai akhir telah dihitung.');
            setShowConfirmModal(false);
            fetchData();
        } catch (err: unknown) {
            console.error('Error finalizing:', err);
            showToast('error', getHttpErrorMessage(err, 'Gagal memfinalisasi'));
        } finally {
            setIsFinalizingLocal(false);
        }
    };

    // Stats untuk progress
    const progressStats = useMemo(() => {
        const total = wawancaraData.length;
        const sudahDinilai = wawancaraData.filter(d => d.nilai_wawancara !== null).length;
        const belumDinilai = total - sudahDinilai;
        return { total, sudahDinilai, belumDinilai };
    }, [wawancaraData]);

    // Group by kategori untuk tampilan list
    const groupedByKategori = useMemo(() => {
        const groups: Record<string, WawancaraData[]> = {};
        wawancaraData.forEach(item => {
            if (!groups[item.kategori]) groups[item.kategori] = [];
            groups[item.kategori].push(item);
        });
        return groups;
    }, [wawancaraData]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <FaSpinner className="animate-spin text-green-600 text-3xl" />
                <span className="ml-3 text-gray-600">Memuat data...</span>
            </div>
        );
    }

    // Get kategori label
    const getKategoriLabel = (value: string) => {
        const opt = kategoriOptions.find(o => o.value === value);
        return opt?.label || value.replace(/_/g, ' ');
    };

    return (
        <div className="space-y-8">
            {/* BAGIAN 1: HEADER + PROGRESS STATS */}
            <div>
                <div className="pb-4 mb-6 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-800">Penilaian Wawancara & Perhitungan Nirwasita Tantra Final</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Pilih kandidat dari daftar di bawah atau gunakan dropdown untuk menilai wawancara.
                    </p>
                </div>

                {/* Progress Cards */}
                <div className="grid grid-cols-9 gap-4 mb-6">
                    <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                        <div className="text-3xl font-bold text-blue-700">{progressStats.total}</div>
                        <div className="text-sm text-green-600">Total Kandidat</div>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                        <div className="text-3xl font-bold text-green-700">{progressStats.sudahDinilai}</div>
                        <div className="text-sm text-green-600">Sudah Dinilai</div>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                        <div className="text-3xl font-bold text-yellow-700">{progressStats.belumDinilai}</div>
                        <div className="text-sm text-green-600">Belum Dinilai</div>
                    </div>
                </div>
            </div>

            {/* BAGIAN 2: LIST KANDIDAT PER KATEGORI */}
            <div>
                <div className="pb-4 mb-4 border-b border-gray-200">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <FaUsers className="text-green-600" /> Daftar Kandidat Wawancara
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Klik pada kandidat untuk langsung menilai</p>
                </div>

                {/* Grid of Category Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Object.entries(groupedByKategori).map(([kategori, items]) => {
                        const sudahDinilaiCount = items.filter(i => i.nilai_wawancara !== null).length;
                        const progress = (sudahDinilaiCount / items.length) * 100;
                        
                        return (
                            <div key={kategori} className="bg-green-50/60 backdrop-blur-sm rounded-2xl border border-green-200/50 overflow-hidden hover:shadow-lg transition-shadow">
                                {/* Card Header */}
                                <div className="px-4 py-3">
                                    <h4 className="font-semibold text-green-600 capitalize text-sm">{getKategoriLabel(kategori)}</h4>
                                    <div className="flex items-center justify-between mt-1">
                                        <span className="text-xs text-green-600">{sudahDinilaiCount}/{items.length} dinilai</span>
                                        <span className="text-xs font-bold text-green-600">{progress.toFixed(0)}%</span>
                                    </div>
                                    {/* Progress Bar */}
                                    <div className="mt-2 h-1.5 bg-white/90 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-green-900 rounded-full transition-all duration-500"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                                
                                {/* Card Body - List DLH */}
                                <div className="p-3 max-h-[280px] overflow-y-auto">
                                    <div className="space-y-1.5">
                                        {items.map(item => {
                                            const sudahDinilai = item.nilai_wawancara !== null;
                                            const isSelected = selectedDinas === item.id;
                                            return (
                                                <button
                                                    key={item.id}
                                                    onClick={() => {
                                                        setSelectedKategori(item.kategori);
                                                        setSelectedDinas(item.id);
                                                    }}
                                                    className={`
                                                        w-full px-3 py-2.5 rounded-xl text-left text-sm transition-all
                                                        ${isSelected 
                                                            ? 'bg-green-600 text-white shadow-md scale-[1.02]' 
                                                            : sudahDinilai 
                                                                ? 'bg-white/80 text-green-800 hover:bg-white border border-green-200' 
                                                                : 'bg-yellow-40/80 text-orange-800 hover:bg-orange-100/80 border border-orange-200'
                                                        }
                                                    `}
                                                >
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            {sudahDinilai ? (
                                                                <FaCheckCircle className={`flex-shrink-0 ${isSelected ? 'text-green-200' : 'text-green-500'}`} />
                                                            ) : (
                                                                <span className="flex-shrink-0 w-4 h-4 rounded-full border-2 border-orange-400 bg-white" />
                                                            )}
                                                            <span className="truncate font-medium">
                                                                {item.nama_dinas.replace('DLH ', '').replace('Dinas Lingkungan Hidup ', '')}
                                                            </span>
                                                        </div>
                                                        {sudahDinilai && (
                                                            <span className={`
                                                                flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full
                                                                ${isSelected ? 'bg-white/30 text-white' : 'bg-green-100 text-green-700'}
                                                            `}>
                                                                {Number(item.nilai_wawancara).toFixed(0)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* BAGIAN 2B: DROPDOWN ALTERNATIF (COLLAPSED) */}
            <details className="bg-green-50/40 rounded-xl border border-green-200/50 overflow-hidden">
                <summary className="px-4 py-3 cursor-pointer hover:bg-green-100/50 transition-colors">
                    <span className="text-sm font-medium text-green-700 flex items-center gap-2">
                        <FaFilter className="text-green-500" /> Filter Alternatif (Dropdown)
                    </span>
                </summary>
                <div className="px-4 pb-4 pt-2">
                    <div className="flex flex-wrap gap-4">
                        {/* Dropdown 1: Jenis DLH */}
                        <div className="w-64">
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Jenis DLH</label>
                            <select 
                                value={selectedKategori}
                                onChange={(e) => {
                                    setSelectedKategori(e.target.value);
                                    setSelectedDinas(null);
                                }}
                                className="w-full border border-green-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                            >
                                {kategoriOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Dropdown 2: Pilih Dinas (conditional) */}
                        {selectedKategori && (
                            <div className="w-80">
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Pilih Kab/Kota</label>
                                <select 
                                    value={selectedDinas || ''}
                                    onChange={(e) => setSelectedDinas(e.target.value ? parseInt(e.target.value) : null)}
                                    className="w-full border border-green-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                                >
                                    <option value="">-- Pilih Kab/Kota --</option>
                                    {filteredDinasOptions.map(dinas => (
                                        <option key={dinas.id} value={dinas.id}>
                                            {dinas.nama_dinas} {dinas.nilai_wawancara !== null ? `(${Number(dinas.nilai_wawancara).toFixed(0)})` : '(Belum dinilai)'}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>
            </details>

            {/* BAGIAN 3: FORM INPUT WAWANCARA - ALWAYS SHOW */}
            <div>
                <div className="pb-4 mb-6 border-b border-gray-200">
                    <h3 className="font-bold text-gray-800">Penilaian Wawancara & Perhitungan Nirwasita Tantra Final</h3>
                </div>
                
                {/* Table Komponen Wawancara */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                    <table className="w-full">
                        <thead className="bg-green-100">
                            <tr>
                                <th className="py-3 px-4 text-left text-xs font-bold text-gray-700 uppercase">KOMPONEN</th>
                                <th className="py-3 px-4 text-center text-xs font-bold text-gray-700 uppercase">BOBOT</th>
                                <th className="py-3 px-4 text-center text-xs font-bold text-gray-700 uppercase">SKOR(0-100)</th>
                                <th className="py-3 px-4 text-center text-xs font-bold text-gray-700 uppercase">SKOR AKHIR</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            <tr className="hover:bg-gray-50">
                                <td className="py-3 px-4 text-sm text-gray-800">Komponen Wawancara</td>
                                <td className="py-3 px-4 text-center text-sm text-teal-600 font-medium">10%</td>
                                <td className="py-3 px-4 text-center">
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onBlur={handleUpdateNilai}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleUpdateNilai();
                                            }
                                        }}
                                        disabled={!currentDinasData || isFinalized || updatingId === currentDinasData?.id}
                                        className="w-24 px-2 py-1 border border-gray-300 rounded text-center text-sm disabled:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        placeholder="/100"
                                    />
                                </td>
                                <td className="py-3 px-4 text-center text-sm text-teal-600 font-medium">
                                    {currentDinasData?.nilai_wawancara 
                                        ? Number(currentDinasData.nilai_wawancara).toFixed(1) 
                                        : '0.0'}
                                </td>
                            </tr>
                            <tr className="bg-gray-50 font-bold">
                                <td colSpan={3} className="py-3 px-4 text-sm text-gray-800 text-right">Total Skor Akhir Wawancara:</td>
                                <td className="py-3 px-4 text-center text-sm text-teal-600 font-bold">
                                    {currentDinasData?.nilai_wawancara 
                                        ? Number(currentDinasData.nilai_wawancara).toFixed(1) 
                                        : '0.0'}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* BAGIAN 4: RINGKASAN NILAI AKHIR - ALWAYS SHOW */}
            <div>
                <div className="pb-4 mb-6 border-b border-gray-200">
                    <h3 className="font-bold text-gray-800">Ringkasan Nilai Akhir</h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Info Dinas */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="text-sm text-gray-600 w-32">Nama Daerah</div>
                            <div className="text-sm font-semibold text-gray-800">
                                {currentDinasData?.nama_dinas || '-'}
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-sm text-gray-600 w-32">Jenis DLH</div>
                            <div className="text-sm font-semibold text-gray-800 capitalize">
                                {currentDinasData?.kategori?.replace(/_/g, ' ') || '-'}
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-sm text-gray-600 w-32">Tahun Penilaian</div>
                            <div className="text-sm font-semibold text-gray-800">{year}</div>
                        </div>
                    </div>

                    {/* Right: Nilai NT Final */}
                    <div className="flex items-center justify-center">
                        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 text-center w-64">
                            <div className="text-sm text-gray-600 mb-2">Nilai NT Final</div>
                            <div className="text-5xl font-bold text-green-600">
                                {nilaiNTFinal !== null ? nilaiNTFinal.toFixed(1) : '-'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* BAGIAN 5: RINCIAN SKOR PER TAHAP */}
            <div>
                <div className="pb-4 mb-6 border-b border-gray-200">
                    <h3 className="font-bold text-gray-800">Rincian Skor per Tahap</h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {/* Penilaian SLHD */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                        <div className="text-xs text-gray-500 mb-2">Penilaian SLHD</div>
                        <div className="text-2xl font-bold text-gray-800">
                            {loadingRekap ? '...' : (rekapData?.nilai_slhd ? Number(rekapData.nilai_slhd).toFixed(0) : '-')}
                        </div>
                    </div>

                    {/* Penilaian Penghargaan */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                        <div className="text-xs text-gray-500 mb-2">Penilaian Penghargaan</div>
                        <div className="text-2xl font-bold text-gray-800">
                            {loadingRekap ? '...' : (rekapData?.nilai_penghargaan ? Number(rekapData.nilai_penghargaan).toFixed(0) : '-')}
                        </div>
                    </div>

                    {/* Validasi 1 */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                        <div className="text-xs text-gray-500 mb-2">Validasi 1</div>
                        <div className="text-2xl font-bold text-gray-800">
                            {loadingRekap ? '...' : (rekapData?.lolos_validasi1 ? 'Lolos' : 'Tidak Lolos')}
                        </div>
                    </div>

                    {/* Validasi 2 */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                        <div className="text-xs text-gray-500 mb-2">Validasi 2</div>
                        <div className="text-2xl font-bold text-gray-800">
                            {loadingRekap ? '...' : (rekapData?.lolos_validasi2 ? 'Lolos' : 'Tidak Lolos')}
                        </div>
                    </div>

                    {/* Wawancara */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                        <div className="text-xs text-gray-500 mb-2">Wawancara</div>
                        <div className="text-2xl font-bold text-gray-800">
                            {currentDinasData?.nilai_wawancara ? Number(currentDinasData.nilai_wawancara).toFixed(0) : '-'}
                        </div>
                    </div>
                </div>
            </div>

            {/* BAGIAN 6: TOMBOL FINALISASI */}
            {isFinalized ? (
                <div className="flex justify-end">
                    <FinalizedBadge />
                </div>
            ) : wawancaraData.length > 0 && (
                <div className="flex justify-end">
                    <button
                        onClick={() => setShowConfirmModal(true)}
                        disabled={progressStats.belumDinilai > 0}
                        className="bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                        title={progressStats.belumDinilai > 0 ? `Masih ada ${progressStats.belumDinilai} kandidat yang belum dinilai` : ''}
                    >
                        <FaLock /> Finalisasi Nilai Akhir
                    </button>
                    {progressStats.belumDinilai > 0 && (
                        <span className="ml-3 text-sm text-orange-600 self-center">
                            ⚠️ {progressStats.belumDinilai} kandidat belum dinilai
                        </span>
                    )}
                </div>
            )}

            {/* Confirmation Modal */}
            <ConfirmModal
                isOpen={showConfirmModal}
                title="Finalisasi Hasil Wawancara"
                message="Apakah Anda yakin ingin memfinalisasi hasil wawancara? Setelah difinalisasi, nilai akhir akan dihitung dan data tidak dapat diubah."
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
