'use client';

import Link from 'next/link';

export default function AdminQuickLinks() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Link
        href="/admin-dashboard/settings"
        className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition flex items-center justify-between group"
      >
        <div>
          <h3 className="text-lg font-semibold text-gray-800 group-hover:text-green-600 transition-colors">Kelola Pusdatin</h3>
          <p className="text-sm text-gray-500">Tambah atau hapus akun khusus Pusdatin.</p>
        </div>
        <span className="text-2xl text-gray-400 group-hover:text-green-500">&rarr;</span>
      </Link>

      <Link
        href="/admin-dashboard/users/logs"
        className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition flex items-center justify-between group"
      >
        <div>
          <h3 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">Lihat Log Aktivitas</h3>
          <p className="text-sm text-gray-500">Pantau riwayat aktivitas pengguna di sistem.</p>
        </div>
        <span className="text-2xl text-gray-400 group-hover:text-blue-500">&rarr;</span>
      </Link>
    </div>
  );
}
