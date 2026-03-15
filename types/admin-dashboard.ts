export interface TimelineItem {
  tahap: string;
  label: string;
  order: number;
  status: 'completed' | 'active' | 'pending';
  deadline?: {
    tanggal: string;
    tanggal_formatted: string;
    is_passed: boolean;
  };
  statistik?: {
    total_submission?: number;
    finalized?: number;
    total_dinilai?: number;
    lolos?: number;
    tidak_lolos?: number;
    total_peserta?: number;
    masuk_penghargaan?: number;
  };
}

export interface TimelinePenilaian {
  year: number;
  tahap_aktif: string;
  tahap_label: string;
  pengumuman_terbuka: boolean;
  keterangan: string;
  tahap_mulai_at: string;
  progress_percentage: number;
  timeline: TimelineItem[];
  summary: {
    total_dinas_terdaftar: number;
    total_submission: number;
    lolos_slhd: number;
    masuk_penghargaan: number;
    lolos_validasi_1: number;
    lolos_validasi_2: number;
  };
}

export interface DashboardData {
  total_users_aktif: number;
  total_users_pending: number;
  year: number;
  users: {
    total: number;
    pending_approval: number;
    active: number;
    by_role: {
      admin: number;
      pusdatin: number;
      dinas: number;
    };
    dinas_by_type: {
      provinsi: number;
      kabupaten_kota: number;
    };
  };
  submissions: {
    total: number;
    by_status: {
      draft: number;
      finalized: number;
      approved: number;
    };
  };
  storage: {
    used_mb: number;
    used_gb: number;
  };
  timeline_penilaian: TimelinePenilaian;
}
