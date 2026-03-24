'use client';

import { RefreshCw } from 'lucide-react';

export default function AdminDashboardHeader({
  isRefreshing,
  onRefresh,
}: {
  isRefreshing: boolean;
  onRefresh: () => void;
}) {
  return (
    <header className="flex items-start justify-between">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-800">Dashboard Admin</h1>
        <p className="text-gray-600 mt-1">Selamat datang kembali, Admin. Berikut ringkasan sistem saat ini.</p>
      </div>
      <button
        onClick={onRefresh}
        disabled={isRefreshing}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
          isRefreshing ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-green-600 border-green-300 hover:bg-green-50'
        }`}
      >
        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        <span className="font-medium">{isRefreshing ? 'Memperbarui...' : 'Refresh'}</span>
      </button>
    </header>
  );
}
