'use client';

import type { TimelinePenilaian } from '@/types/admin-dashboard';

export default function TahapanInfoCard({ timeline }: { timeline: TimelinePenilaian }) {
  return (
    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl h-[100%] p-6  text-white shadow-lg">
      <div className="flex items-center justify-between mb-4 pb-5">
        <h3 className="font-bold text-lg">Tahap Aktif</h3>
        <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">{timeline.progress_percentage}% selesai</span>
      </div>
      <p className="text-2xl font-bold mb-2">{timeline.tahap_label}</p>
      <p className="text-green-50 text-sm leading-relaxed">{timeline.keterangan}</p>
      {timeline.pengumuman_terbuka && (
        <div className="mt-4 flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span className="text-sm font-medium">Pengumuman Tersedia</span>
        </div>
      )}

      <div className="mt-4 bg-white/20 rounded-full h-2.5 overflow-hidden">
        <div
          className="bg-white rounded-full h-2.5 transition-all duration-500 shadow-sm "
          style={{ width: `${timeline.progress_percentage}%` }}
        />
      </div>
    </div>
  );
}
