'use client';

import type { DlhDashboardData } from '@/types/dlh-dashboard';

const CalendarIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

export default function DlhDeadlineCard({ deadline }: { deadline: DlhDashboardData['deadline'] }) {
  if (!deadline) {
    return (
      <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
        <div className="flex items-center gap-3 mb-2">
          <CalendarIcon />
          <h3 className="font-bold text-gray-800">Deadline Submission</h3>
        </div>
        <p className="text-gray-500 text-sm">Belum ada deadline yang ditetapkan</p>
      </div>
    );
  }

  const variant = deadline.is_passed ? 'danger' : deadline.days_remaining <= 7 ? 'warning' : 'success';
  const bgColors = {
    success: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    danger: 'bg-red-50 border-red-200',
  };

  return (
    <div className={`rounded-xl p-5 border ${bgColors[variant]}`}>
      <div className="flex items-center gap-3 mb-3">
        <CalendarIcon />
        <h3 className="font-bold text-gray-800">Deadline Submission</h3>
      </div>
      <p className="text-2xl font-bold text-gray-900">{deadline.deadline_formatted}</p>
      {!deadline.is_passed ? (
        <p className={`text-sm mt-1 ${variant === 'warning' ? 'text-yellow-700' : 'text-green-700'}`}>
          {Math.floor(deadline.days_remaining)} hari lagi
        </p>
      ) : (
        <p className="text-sm mt-1 text-red-700 font-medium">Deadline telah terlewat</p>
      )}
      {deadline.catatan && <p className="text-xs text-gray-600 mt-2 italic">{deadline.catatan}</p>}
    </div>
  );
}
