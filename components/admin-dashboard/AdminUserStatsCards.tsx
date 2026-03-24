'use client';

import Link from 'next/link';
import { Clock, Users } from 'lucide-react';

export default function AdminUserStatsCards({
  totalUsersAktif,
  totalUsersPending,
}: {
  totalUsersAktif: number;
  totalUsersPending: number;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Link href="/admin-dashboard/users/aktif" className="block group">
        <div className="bg-white border-2 border-green-200 rounded-xl p-6 hover:shadow-lg transition-all hover:border-green-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 mb-1">Total User Aktif</p>
              <p className="text-4xl font-bold text-green-700">{totalUsersAktif}</p>
            </div>
            <div className="w-14 h-14 rounded-xl bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
              <Users className="w-7 h-7 text-green-600" />
            </div>
          </div>
        </div>
      </Link>

      <Link href="/admin-dashboard/users/pending" className="block group">
        <div className="bg-white border-2 border-yellow-200 rounded-xl p-6 hover:shadow-lg transition-all hover:border-yellow-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600 mb-1">Menunggu Persetujuan (Pending)</p>
              <p className="text-4xl font-bold text-yellow-700">{totalUsersPending}</p>
            </div>
            <div className="w-14 h-14 rounded-xl bg-yellow-50 flex items-center justify-center group-hover:bg-yellow-100 transition-colors">
              <Clock className="w-7 h-7 text-yellow-600" />
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
