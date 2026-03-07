'use client';

import { useState, useEffect, useCallback } from 'react';
import { FiFileText, FiAward, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import type { IconType } from 'react-icons';
import axios from '@/lib/axios';
import PenerimaanTable, { SlhdData, IklhData } from '@/components/penerimaan/PenerimaanTable';
import FilterSection from '@/components/shared/filters/FilterSection';
import FilterSelect from '@/components/shared/filters/FilterSelect';
import FilterAction from '@/components/shared/filters/FilterAction';
import PaginationBar from '@/components/shared/pagination/PaginationBar';

interface Province {
  id: number;
  nama_region: string;
}

const CURRENT_YEAR = new Date().getFullYear();

interface ReviewDinas {
  kabupaten_kota?: string;
  provinsi?: string;
  kategori?: string;
  tipologi?: string;
}

interface SlhdReviewApiItem {
  id?: number;
  submission_id?: number;
  dinas?: ReviewDinas;
  buku_i?: string;
  buku_ii?: string;
  buku_iii?: string;
  tabel_utama?: string;
}

interface IklhReviewApiItem {
  id: number;
  kabupaten_kota?: string;
  provinsi?: string;
  jenis_dlh?: string;
  tipologi?: string;
  indeks_kualitas_air?: number;
  indeks_kualitas_udara?: number;
  indeks_kualitas_lahan?: number;
  has_pesisir?: boolean | number | string;
  indeks_kualitas_pesisir_laut?: number;
  indeks_kualitas_kehati?: number;
  total_iklh?: number;
  status?: string;
}

type SlhdStatus = SlhdData['buku_1_status'];

const normalizeSlhdStatus = (status: string | undefined): SlhdStatus => {
  if (status === 'draft' || status === 'finalized' || status === 'approved' || status === 'rejected') {
    return status;
  }
  return undefined;
};

// Tab Button Component
function TabButton({ label, icon: Icon, active, onClick }: { label: string; icon: IconType; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
        active
          ? 'border-green-600 text-green-600'
          : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

export default function PenerimaanKabKotaPage() {
  // State
  const [activeTab, setActiveTab] = useState<'SLHD' | 'IKLH'>('SLHD');
  const [loading, setLoading] = useState(true);
  const [slhdData, setSlhdData] = useState<SlhdData[]>([]);
  const [iklhData, setIklhData] = useState<IklhData[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  
  // Filters
  const [filterProvinsi, setFilterProvinsi] = useState('');
  const [filterKategori, setFilterKategori] = useState('');
  const [filterTopologi, setFilterTopologi] = useState('');
  const filterYear = CURRENT_YEAR;
  const search = '';
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Fetch provinces on mount
  useEffect(() => {
    axios.get('/api/wilayah/provinces')
      .then(res => setProvinces(res.data?.data || []))
      .catch(console.error);
  }, []);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        per_page: 15,
        page,
        type: 'kabupaten/kota'
      };
      
      if (filterProvinsi) params.provinsi_id = filterProvinsi;
      if (filterKategori) params.kategori = filterKategori;
      if (filterTopologi) params.topologi = filterTopologi;
      if (search) params.search = search;

      if (activeTab === 'SLHD') {
        const res = await axios.get(`/api/pusdatin/review/${filterYear}`, { params });
        const data: SlhdReviewApiItem[] = Array.isArray(res.data?.data) ? res.data.data : [];
        
        setSlhdData(data.map((s) => ({
          id: Number(s.submission_id ?? s.id ?? 0),
          kabkota: s.dinas?.kabupaten_kota || '-',
          provinsi: s.dinas?.provinsi || '-',
          pembagian_daerah: s.dinas?.kategori || s.dinas?.tipologi || '-',
          tipologi: s.dinas?.tipologi || '-',
          buku_1: (s.buku_i && s.buku_i !== 'Belum Upload') ? 'Buku I' : null,
          buku_2: (s.buku_ii && s.buku_ii !== 'Belum Upload') ? 'Buku II' : null,
          buku_3: (s.buku_iii && s.buku_iii !== 'Belum Upload') ? 'Buku III' : null,
          tabel_utama: (s.tabel_utama && s.tabel_utama !== 'Belum Upload') ? 'Tabel Utama' : null,
          buku_1_status: normalizeSlhdStatus(s.buku_i),
          buku_2_status: normalizeSlhdStatus(s.buku_ii),
          buku_3_status: normalizeSlhdStatus(s.buku_iii),
        })));
        
        setTotalPages(res.data?.last_page || 1);
        setTotal(res.data?.total || 0);
      } else {
        const res = await axios.get(`/api/pusdatin/review/iklh/${filterYear}`, { params });
        const data: IklhReviewApiItem[] = Array.isArray(res.data?.data) ? res.data.data : [];
        
        setIklhData(data.map((s) => ({
          id: s.id,
          kabkota: s.kabupaten_kota || '-',
          provinsi: s.provinsi || '-',
          jenis_dlh: s.jenis_dlh || '-',
          tipologi: s.tipologi || '-',
          ika: s.indeks_kualitas_air || 0,
          iku: s.indeks_kualitas_udara || 0,
          ikl: s.indeks_kualitas_lahan || 0,
          ik_pesisir: (s.has_pesisir === true || s.has_pesisir === 1 || s.has_pesisir === '1') 
            ? (s.indeks_kualitas_pesisir_laut || 0) 
            : null,
          ik_kehati: s.indeks_kualitas_kehati || 0,
          total_iklh: s.total_iklh || 0,
          verifikasi: s.status === 'approved',
        })));
        
        setTotalPages(res.data?.last_page || 1);
        setTotal(res.data?.total || 0);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, filterProvinsi, filterKategori, filterTopologi, filterYear, search]);

  // Fetch on mount and when deps change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [activeTab, filterProvinsi, filterKategori, filterTopologi, filterYear, search]);

  // IKLH verify handler
  const handleVerify = async (item: IklhData, action: 'approved' | 'rejected') => {
    try {
      await axios.post(`/api/pusdatin/review/submission/${item.id}/iklh`, { status: action });
      fetchData();
    } catch (err) {
      console.error('Verify error:', err);
    }
  };

  // Handle filter button click
  const handleFilter = () => {
    setPage(1);
    fetchData();
  };

  return (
    <div className="min-h-screen  p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Penerimaan SLHD Kab/Kota</h1>
        <p className="text-sm text-gray-500 mt-1">
          Atur Penerimaan Data Nilai Nirwasita Tantra dari Dokumen-Dokumen Kab/Kota.
        </p>
      </div>

      {/* Filters */}
      <FilterSection>
        <FilterSelect
          label="Provinsi"
          value={filterProvinsi}
          onChange={(e) => setFilterProvinsi(e.target.value)}
          options={[
            { label: 'Pilih Provinsi', value: '' },
            ...provinces.map((p) => ({ label: p.nama_region, value: String(p.id) })),
          ]}
        />

        <FilterSelect
          label="Pembagian Daerah"
          value={filterKategori}
          onChange={(e) => setFilterKategori(e.target.value)}
          options={[
            { label: 'Pilih Jenis DLH', value: '' },
            { label: 'Kota Kecil', value: 'kota_kecil' },
            { label: 'Kota Sedang', value: 'kota_sedang' },
            { label: 'Kota Besar', value: 'kota_besar' },
            { label: 'Kabupaten Kecil', value: 'kabupaten_kecil' },
            { label: 'Kabupaten Sedang', value: 'kabupaten_sedang' },
            { label: 'Kabupaten Besar', value: 'kabupaten_besar' },
          ]}
        />

        <FilterSelect
          label="Topologi Wilayah"
          value={filterTopologi}
          onChange={(e) => setFilterTopologi(e.target.value)}
          options={[
            { label: 'Pilih Topologi Wilayah', value: '' },
            { label: 'Daratan', value: 'daratan' },
            { label: 'Pesisir', value: 'pesisir' },
          ]}
        />

        <FilterAction onClick={handleFilter} />
      </FilterSection>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-4">
          <TabButton 
            label="SLHD" 
            icon={FiFileText} 
            active={activeTab === 'SLHD'} 
            onClick={() => setActiveTab('SLHD')} 
          />
          <TabButton 
            label="IKLH" 
            icon={FiAward} 
            active={activeTab === 'IKLH'} 
            onClick={() => setActiveTab('IKLH')} 
          />
        </div>
      </div>

      {/* Table */}
      <PenerimaanTable
        activeTab={activeTab}
        data={activeTab === 'SLHD' ? slhdData : iklhData}
        onVerify={handleVerify}
        isProcessing={false}
        currentPath="kab-kota"
        loading={loading}
        onRefresh={fetchData}
      />

      {/* Pagination */}
      <PaginationBar
        page={page}
        totalPages={totalPages}
        totalItems={total}
        onPageChange={setPage}
        prevIcon={<FiChevronLeft />}
        nextIcon={<FiChevronRight />}
      />
    </div>
  );
}
