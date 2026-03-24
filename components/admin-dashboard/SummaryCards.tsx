'use client';

import { Users, FileText, Check } from 'lucide-react';
import type { DashboardData, TimelinePenilaian } from '@/types/admin-dashboard';

export default function SummaryCards({
  summary,
  submissions,
}: {
  summary: TimelinePenilaian['summary'];
  submissions: DashboardData['submissions'];
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
            <Users className="w-4 h-4 text-green-600" />
          </div>
          <span className="text-xs font-medium text-gray-600">Dinas Terdaftar</span>
        </div>
        <div className="text-2xl font-bold text-gray-900">{summary.total_dinas_terdaftar}</div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
            <FileText className="w-4 h-4 text-green-600" />
          </div>
          <span className="text-xs font-medium text-gray-600">Total Submission</span>
        </div>
        <div className="text-2xl font-bold text-gray-900">{summary.total_submission}</div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
            <FileText className="w-4 h-4 text-red-600" />
          </div>
          <span className="text-xs font-medium text-gray-600">Submission Draft</span>
        </div>
        <div className="text-2xl font-bold text-gray-900">{submissions.by_status.draft}</div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center">
            <Check className="w-4 h-4 text-green-600" />
          </div>
          <span className="text-xs font-medium text-green-700">Lolos Penilaian SLHD</span>
        </div>
        <div className="text-2xl font-bold text-green-800">{summary.lolos_slhd}</div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
            <Check className="w-4 h-4 text-green-600" />
          </div>
          <span className="text-xs font-medium text-gray-600">Lolos Validasi 1</span>
        </div>
        <div className="text-2xl font-bold text-gray-900">{summary.lolos_validasi_1}</div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
            <Check className="w-4 h-4 text-green-600" />
          </div>
          <span className="text-xs font-medium text-gray-600">Lolos Validasi 2</span>
        </div>
        <div className="text-2xl font-bold text-gray-900">{summary.lolos_validasi_2}</div>
      </div>
    </div>
  );
}
