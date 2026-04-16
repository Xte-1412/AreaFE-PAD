'use client';

import type { DlhDashboardData } from '@/types/dlh-dashboard';

const tahapNames: Record<string, string> = {
  submission: 'Upload Dokumen',
  penilaian_slhd: 'Penilaian SLHD',
  penilaian_penghargaan: 'Penilaian Penghargaan',
  validasi_1: 'Validasi 1',
  validasi_2: 'Validasi 2',
  wawancara: 'Wawancara',
  selesai: 'Selesai',
};

export default function DlhTahapanInfo({ tahapan }: { tahapan: DlhDashboardData['tahapan'] }) {
  return (
    <div className="rounded-xl p-5 border border-green-700">
      <h3 className="font-bold text-gray-800 mb-2">Tahap Aktif Saat Ini</h3>
      <p className="text-xl font-bold text-blue-800">{tahapNames[tahapan.tahap_aktif] || tahapan.tahap_aktif}</p>
      <p className="text-sm text-gray-600 mt-1">{tahapan.keterangan}</p>
      {tahapan.pengumuman_terbuka && (
        <div className="mt-3 flex items-center gap-2 text-green-700">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium">Pengumuman Tersedia</span>
        </div>
      )}
    </div>
  );
}
