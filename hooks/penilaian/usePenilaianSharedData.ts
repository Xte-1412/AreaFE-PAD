import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from '@/lib/axios';
import type { DinasSubmission, Province } from '@/types/penilaian';

interface StageProgressSummary {
  finalized: number;
  is_finalized: boolean;
  processed?: number;
  checked?: number;
  lolos?: number;
  with_nilai?: number;
}

interface PenilaianProgressStats {
  slhd: StageProgressSummary;
  penghargaan: StageProgressSummary;
  validasi1: StageProgressSummary;
  validasi2: StageProgressSummary;
  wawancara: StageProgressSummary;
  total_dlh: number;
}

interface PenilaianProgressCardItem {
  stage: string;
  progress: number;
  detail: string;
  isCompleted: boolean;
  tabValue: string;
}

interface UsePenilaianSharedDataResult {
  provinsiList: Province[];
  submissions: DinasSubmission[];
  sharedDataLoading: boolean;
  progressData: PenilaianProgressCardItem[];
  refreshSubmissions: () => Promise<void>;
}

const DEFAULT_PROGRESS: PenilaianProgressCardItem[] = [
  { stage: 'Tahap 1 (SLHD)', progress: 0, detail: 'Memuat...', isCompleted: false, tabValue: 'slhd' },
  { stage: 'Tahap 2 (Penghargaan)', progress: 0, detail: 'Memuat...', isCompleted: false, tabValue: 'penghargaan' },
  { stage: 'Tahap 3 (Validasi 1)', progress: 0, detail: 'Memuat...', isCompleted: false, tabValue: 'validasi1' },
  { stage: 'Tahap 4 (Validasi 2)', progress: 0, detail: 'Memuat...', isCompleted: false, tabValue: 'validasi2' },
  { stage: 'Tahap 5 (Wawancara)', progress: 0, detail: 'Memuat...', isCompleted: false, tabValue: 'wawancara' },
];

export function usePenilaianSharedData(year: number): UsePenilaianSharedDataResult {
  const [progressStats, setProgressStats] = useState<PenilaianProgressStats | null>(null);
  const [provinsiList, setProvinsiList] = useState<Province[]>([]);
  const [submissions, setSubmissions] = useState<DinasSubmission[]>([]);
  const [sharedDataLoading, setSharedDataLoading] = useState(true);

  const refreshSubmissions = useCallback(async () => {
    try {
      const submissionsRes = await axios.get(`/api/pusdatin/penilaian/submissions?year=${year}`);
      setSubmissions(submissionsRes.data?.data || []);
    } catch (err) {
      console.error('Error refreshing submissions:', err);
    }
  }, [year]);

  useEffect(() => {
    const fetchSharedData = async () => {
      try {
        setSharedDataLoading(true);

        let provincesData: Province[] = [];
        let submissionsData: DinasSubmission[] = [];
        let progressData: PenilaianProgressStats | null = null;

        try {
          const provincesRes = await axios.get('/api/wilayah/provinces');
          provincesData = provincesRes.data?.data || provincesRes.data || [];
        } catch (err) {
          console.error('Error fetching provinces:', err);
        }

        try {
          const submissionsRes = await axios.get(`/api/pusdatin/penilaian/submissions?year=${year}`);
          submissionsData = submissionsRes.data?.data || submissionsRes.data || [];
        } catch (err) {
          console.error('Error fetching submissions:', err);
        }

        try {
          const progressRes = await axios.get(`/api/pusdatin/penilaian/progress-stats?year=${year}`);
          progressData = progressRes.data?.data || progressRes.data || null;
        } catch (err) {
          console.error('Error fetching progress stats:', err);
        }

        setProvinsiList(provincesData);
        setSubmissions(submissionsData);
        setProgressStats(progressData);
      } catch (err) {
        console.error('Error fetching shared data:', err);
      } finally {
        setSharedDataLoading(false);
      }
    };

    fetchSharedData();
  }, [year]);

  const progressData = useMemo<PenilaianProgressCardItem[]>(() => {
    if (!progressStats) {
      return DEFAULT_PROGRESS;
    }

    const slhd = progressStats.slhd || { finalized: 0, is_finalized: false };
    const penghargaan = progressStats.penghargaan || { finalized: 0, is_finalized: false };
    const validasi1 = progressStats.validasi1 || { processed: 0, lolos: 0, is_finalized: false };
    const validasi2 = progressStats.validasi2 || { processed: 0, checked: 0, lolos: 0, is_finalized: false };
    const wawancara = progressStats.wawancara || { processed: 0, with_nilai: 0, is_finalized: false };
    const totalDlh = progressStats.total_dlh || 0;

    return [
      {
        stage: 'Tahap 1 (SLHD)',
        progress: totalDlh > 0 ? Math.round(((slhd.finalized || 0) / totalDlh) * 100) : 0,
        detail: slhd.is_finalized
          ? `Difinalisasi - ${slhd.finalized || 0}/${totalDlh} DLH`
          : `Terbuka - ${slhd.finalized || 0}/${totalDlh} DLH`,
        isCompleted: slhd.is_finalized,
        tabValue: 'slhd',
      },
      {
        stage: 'Tahap 2 (Penghargaan)',
        progress: penghargaan.is_finalized ? 100 : 0,
        detail: slhd.is_finalized
          ? (penghargaan.is_finalized
              ? `Difinalisasi - ${penghargaan.finalized || 0} DLH Lulus`
              : `Terbuka - ${penghargaan.finalized || 0}/${totalDlh} DLH`)
          : 'Menunggu SLHD',
        isCompleted: penghargaan.is_finalized,
        tabValue: 'penghargaan',
      },
      {
        stage: 'Tahap 3 (Validasi 1)',
        progress: validasi1.is_finalized ? 100 : 0,
        detail: penghargaan.is_finalized
          ? (validasi1.is_finalized
              ? `Difinalisasi - Lulus: ${validasi1.lolos || 0}/${validasi1.processed || 0} DLH`
              : `memproses ${validasi1.processed || 0} DLH`)
          : 'Menunggu Penghargaan',
        isCompleted: validasi1.is_finalized,
        tabValue: 'validasi1',
      },
      {
        stage: 'Tahap 4 (Validasi 2)',
        progress: validasi2.is_finalized
          ? 100
          : ((validasi2.processed || 0) > 0 ? Math.round(((validasi2.checked || 0) / (validasi2.processed || 1)) * 100) : 0),
        detail: validasi1.is_finalized
          ? (validasi2.is_finalized
              ? `Difinalisasi - Lulus: ${validasi2.lolos || 0}/${validasi2.processed || 0} DLH`
              : `memproses: ${validasi2.checked || 0}/${validasi2.processed || 0} DLH`)
          : 'Menunggu Validasi 1',
        isCompleted: validasi2.is_finalized,
        tabValue: 'validasi2',
      },
      {
        stage: 'Tahap 5 (Wawancara)',
        progress: wawancara.is_finalized
          ? 100
          : ((wawancara.with_nilai || 0) > 0 ? Math.round(((wawancara.with_nilai || 0) / ((validasi2.lolos || 0) || 1)) * 100) : 0),
        detail: validasi2.is_finalized
          ? (wawancara.is_finalized
              ? `Selesai - ${wawancara.processed || 0} DLH Diproses`
              : `memproses: ${wawancara.with_nilai || 0}/${validasi2.lolos || 0} DLH`)
          : 'Menunggu Validasi 2',
        isCompleted: wawancara.is_finalized,
        tabValue: 'wawancara',
      },
    ];
  }, [progressStats]);

  return {
    provinsiList,
    submissions,
    sharedDataLoading,
    progressData,
    refreshSubmissions,
  };
}
