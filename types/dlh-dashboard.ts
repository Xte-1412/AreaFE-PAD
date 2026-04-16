export interface DlhDokumenItem {
  nama: string;
  status: string;
  uploaded: boolean;
  count?: number;
  total_required?: number;
  finalized_count?: number;
  updated_at?: string;
}

export interface DlhTimelineItem {
  tahap: string;
  nama: string;
  status: 'completed' | 'active' | 'pending';
  keterangan: string;
}

export interface DlhDashboardData {
  year: number;
  dinas: {
    id: number;
    nama: string;
    region: string;
    type: 'provinsi' | 'kabupaten/kota';
    has_pesisir: boolean;
  };
  stats: {
    total_dokumen: number;
    total_required: number;
    percentage: number;
    submission_finalized: boolean;
    dokumen: DlhDokumenItem[];
  };
  deadline: {
    deadline_at: string;
    deadline_formatted: string;
    is_passed: boolean;
    days_remaining: number;
    catatan: string | null;
  } | null;
  tahapan: {
    tahap_aktif: string;
    pengumuman_terbuka: boolean;
    keterangan: string;
  };
  timeline: DlhTimelineItem[];
  rekap: {
    nilai_slhd: number | null;
    lolos_slhd: boolean | null;
    nilai_penghargaan: number | null;
    masuk_penghargaan: boolean | null;
    nilai_iklh: number | null;
    total_skor_validasi1: number | null;
    lolos_validasi1: boolean | null;
    lolos_validasi2: boolean | null;
    kriteria_wtp: boolean | null;
    kriteria_kasus_hukum: boolean | null;
    nilai_wawancara: number | null;
    lolos_wawancara: boolean | null;
    total_skor_final: number | null;
    peringkat_final: number | null;
    peringkat: number | null;
    status_akhir: string | null;
  } | null;
}
