'use client';

import type { DlhDashboardData } from '@/types/dlh-dashboard';
import type { ReactNode } from 'react';

const DocumentIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);

export default function DlhDokumenStatusCards({
  dokumen,
  submissionFinalized,
}: {
  dokumen: DlhDashboardData['stats']['dokumen'];
  submissionFinalized: boolean;
}) {
  const getStatusBadge = (status: string, uploaded: boolean) => {
    if (!uploaded) {
      return (
        <span className="flex items-center text-sm font-medium text-gray-500">
          <svg className="w-4 h-4 mr-1.5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          Belum Diunggah
        </span>
      );
    }

    const badges: Record<string, { bg: string; icon: ReactNode; label: string }> = {
      draft: {
        bg: 'text-yellow-600',
        icon: (
          <svg className="w-4 h-4 mr-1.5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
              clipRule="evenodd"
            />
          </svg>
        ),
        label: 'Draft',
      },
      finalized: {
        bg: 'text-blue-600',
        icon: (
          <svg className="w-4 h-4 mr-1.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        ),
        label: 'Terkirim',
      },
      approved: {
        bg: 'text-green-600',
        icon: (
          <svg className="w-4 h-4 mr-1.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        ),
        label: 'Disetujui',
      },
      rejected: {
        bg: 'text-red-600',
        icon: (
          <svg className="w-4 h-4 mr-1.5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        ),
        label: 'Ditolak',
      },
    };

    const badge = badges[status] || badges.draft;
    return (
      <span className={`flex items-center text-sm font-medium ${badge.bg}`}>
        {badge.icon}
        {badge.label}
      </span>
    );
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) {
      return '-';
    }

    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-bold text-gray-800">Status Dokumen</h3>
        {submissionFinalized && (
          <span className="px-3 py-1 rounded-full text-xs bg-green-100 text-green-700 font-medium">
            Submission Terfinalisasi
          </span>
        )}
      </div>
      <div className="p-4 space-y-3">
        {dokumen.map((doc, idx) => (
          <div
            key={idx}
            className="bg-gray-50 p-4 rounded-lg flex items-center justify-between border border-gray-200 hover:border-gray-300 transition-colors"
          >
            <div className="flex items-center">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  doc.uploaded ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400'
                }`}
              >
                <DocumentIcon />
              </div>
              <div className="ml-3">
                <h4 className="font-semibold text-gray-800">{doc.nama}</h4>
                <p className="text-xs text-gray-500">
                  {doc.total_required !== undefined
                    ? `${doc.count}/${doc.total_required} tabel sudah diupload`
                    : doc.updated_at
                      ? `Diperbarui: ${formatDate(doc.updated_at)}`
                      : 'Belum ada dokumen'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">{getStatusBadge(doc.status, doc.uploaded)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
