'use client';

import { useState, useEffect, useCallback } from 'react';
import UniversalModal from '@/components/UniversalModal';
import axios from '@/lib/axios';
import { logClientError } from '@/lib/logger';
import { Calendar, Clock, Save, AlertCircle, RefreshCw } from 'lucide-react';

interface DeadlineData {
  year: number;
  deadline: string | null;
  catatan: string;
  is_passed: boolean | null;
}

const toLocalDateTimeInput = (dateString: string): { date: string; time: string } | null => {
  const parsedDate = new Date(dateString);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  const year = String(parsedDate.getFullYear());
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
  const day = String(parsedDate.getDate()).padStart(2, '0');
  const hour = String(parsedDate.getHours()).padStart(2, '0');
  const minute = String(parsedDate.getMinutes()).padStart(2, '0');

  return {
    date: `${year}-${month}-${day}`,
    time: `${hour}:${minute}`,
  };
};

export default function PengaturanDeadlinePage() {
  const currentYear = new Date().getFullYear();
  const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [deadline, setDeadline] = useState<DeadlineData | null>(null);
  const [deadlineRows, setDeadlineRows] = useState<DeadlineData[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableRefreshing, setTableRefreshing] = useState(false);
  const [tableError, setTableError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('23:59');
  const [catatan, setCatatan] = useState('');
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    variant: 'success' as 'success' | 'warning' | 'danger',
  });

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (
      typeof error === 'object' &&
      error !== null &&
      'response' in error
    ) {
      const response = (error as { response?: { data?: { message?: string } } }).response;
      return response?.data?.message || fallback;
    }

    if (error instanceof Error && error.message) {
      return error.message;
    }

    return fallback;
  };

  const fetchDeadline = useCallback(async (showFullLoader = false) => {
    try {
      if (showFullLoader) {
        setLoading(true);
      } else {
        setTableRefreshing(true);
      }
      setTableError(null);

      const response = await axios.get(`/api/admin/deadline/date/${selectedYear}`);
      const data: DeadlineData = response.data;
      
      setDeadline(data);
      setDeadlineRows(data?.deadline ? [data] : []);
      
      // Parse deadline untuk form
      if (data.deadline) {
        const localDateTime = toLocalDateTimeInput(data.deadline);

        if (localDateTime) {
          setSelectedDate(localDateTime.date);
          setSelectedTime(localDateTime.time);
        }
      } else {
        setSelectedDate('');
        setSelectedTime('23:59');
      }
      
      setCatatan(data.catatan || '');
    } catch (error) {
      logClientError('PengaturanDeadlinePage fetchDeadline', error);
      setTableError('Gagal memuat daftar tenggat. Silakan coba lagi.');
    } finally {
      if (showFullLoader) {
        setLoading(false);
      }
      setTableRefreshing(false);
    }
  }, [selectedYear]);

  // Fetch deadline saat ini
  useEffect(() => {
    fetchDeadline(true);
  }, [fetchDeadline]);

  const handleSave = async () => {
    if (!selectedDate) {
      setModalConfig({
        title: 'Validasi Gagal',
        message: 'Tanggal deadline harus diisi.',
        variant: 'warning',
      });
      setModalOpen(true);
      return;
    }

    try {
      setSaving(true);
      
      // Interpret input berdasarkan timezone perangkat user, lalu kirim sebagai UTC instant.
      const deadlineDateTime = new Date(`${selectedDate}T${selectedTime}:00`);

      if (Number.isNaN(deadlineDateTime.getTime())) {
        setModalConfig({
          title: 'Validasi Gagal',
          message: 'Format tanggal/jam deadline tidak valid.',
          variant: 'warning',
        });
        setModalOpen(true);
        return;
      }
      
      const payload = {
        year: selectedYear,
        deadline_at: deadlineDateTime.toISOString(),
        catatan: catatan || 'Deadline penerimaan data submission',
      };

      await axios.post('/api/admin/deadline/set', payload);
      
     
      
      setModalConfig({
        title: 'Berhasil',
        message: 'Deadline berhasil disimpan!',
        variant: 'success',
      });
      setModalOpen(true);
      
      // Refresh data
      await fetchDeadline();
      
    } catch (error: unknown) {
      logClientError('PengaturanDeadlinePage handleSave', error);
      setModalConfig({
        title: 'Gagal',
        message: getErrorMessage(error, 'Gagal menyimpan deadline. Silakan coba lagi.'),
        variant: 'danger',
      });
      setModalOpen(true);
    } finally {
      setSaving(false);
    }
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '-';

    const dt = new Date(dateString);
    return dt.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  const getTimeRemaining = (dateString: string | null) => {
    if (!dateString) return '-';

    const now = new Date();
    const target = new Date(dateString);
    const diff = target.getTime() - now.getTime();
    
    if (diff <= 0) return 'Sudah lewat';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} hari lagi`;
    return `${hours} jam lagi`;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Breadcrumb */}
      <div className="text-sm text-green-600 mb-4">
        Pengaturan <span className="text-gray-400 mx-2">&gt;</span>
        <span className="text-gray-600">Deadline Submission</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Pengaturan Deadline Submission
        </h1>
        <p className="text-gray-600">
          Atur deadline penerimaan data dokumen dari DLH Provinsi dan Kab/Kota untuk tahun {selectedYear}
        </p>
      </div>

      {/* Year Selector */}
      <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tahun Kelola Deadline
        </label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="w-full sm:w-64 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            disabled={saving || tableRefreshing}
          >
            {[currentYear - 1, currentYear, currentYear + 1, currentYear + 2, currentYear + 3].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-500">
            Ganti tahun untuk mengatur tenggat periode berikutnya tanpa mengubah tahun berjalan.
          </p>
        </div>
      </div>

      {/* Current Deadline Info */}
      {deadline && deadline.deadline && (
        <div className={`mb-6 p-6 rounded-xl border-2 ${
          deadline.is_passed 
            ? 'bg-red-50 border-red-200' 
            : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg ${
              deadline.is_passed ? 'bg-red-100' : 'bg-blue-100'
            }`}>
              <Clock className={`w-6 h-6 ${
                deadline.is_passed ? 'text-red-600' : 'text-blue-600'
              }`} />
            </div>
            <div className="flex-1">
              <h3 className={`text-lg font-semibold mb-1 ${
                deadline.is_passed ? 'text-red-900' : 'text-blue-900'
              }`}>
                Deadline Saat Ini (Tahun {selectedYear})
              </h3>
              <p className={`text-2xl font-bold mb-2 ${
                deadline.is_passed ? 'text-red-700' : 'text-blue-700'
              }`}>
                {formatDateTime(deadline.deadline)}
              </p>
              <div className="flex items-center gap-2 text-sm">
                <span className={`px-3 py-1 rounded-full font-medium ${
                  deadline.is_passed 
                    ? 'bg-red-100 text-red-700' 
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {deadline.is_passed ? '⏰ Sudah Lewat' : `⏳ ${getTimeRemaining(deadline.deadline)}`}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deadline Table (AC #3) */}
      <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Daftar Tenggat Admin</h2>
          <button
            onClick={() => fetchDeadline()}
            disabled={tableRefreshing || saving}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-green-700 border border-green-200 rounded-lg hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${tableRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {tableError ? (
          <div className="p-6">
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p className="font-medium">Gagal memuat tabel tenggat</p>
              <p className="mt-1">{tableError}</p>
              <button
                onClick={() => fetchDeadline()}
                className="mt-3 inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
              >
                Coba Lagi
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">No</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tahun</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Deadline</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Catatan</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Sisa Waktu</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {deadlineRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                      Belum ada tenggat tersimpan untuk tahun {selectedYear}.
                    </td>
                  </tr>
                ) : (
                  deadlineRows.map((item, index) => (
                    <tr key={`${item.year}-${item.deadline ?? 'kosong'}`}>
                      <td className="px-6 py-4 text-sm text-gray-700">{index + 1}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">{item.year}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{formatDateTime(item.deadline)}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{item.catatan || '-'}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          item.is_passed ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {item.is_passed ? 'Lewat' : 'Aktif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{getTimeRemaining(item.deadline)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Atur Deadline Baru
          </h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Tanggal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal Deadline <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={saving}
            />
          </div>

          {/* Waktu */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Waktu Deadline
            </label>
            <input
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={saving}
            />
            <p className="text-xs text-gray-500 mt-1">Waktu mengikuti zona perangkat ({localTimeZone})</p>
          </div>

          {/* Catatan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Catatan (Opsional)
            </label>
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              rows={3}
              placeholder="Deadline penerimaan data submission"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              disabled={saving}
            />
          </div>

          {/* Info */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">Perhatian:</p>
              <ul className="list-disc list-inside space-y-1 text-amber-700">
                <li>Pastikan tanggal dan waktu yang dipilih sudah benar</li>
                <li>Setelah deadline lewat, DLH tidak dapat mengirim data</li>
                <li>Gunakan Tahun Kelola Deadline untuk menyiapkan periode selanjutnya</li>
                <li>Perubahan deadline akan langsung berlaku</li>
              </ul>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              disabled={saving || !selectedDate}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Simpan Deadline</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      <UniversalModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalConfig.title}
        message={modalConfig.message}
        variant={modalConfig.variant}
        showCancelButton={false}
        onConfirm={() => setModalOpen(false)}
        confirmLabel="OK"
      />
    </div>
  );
}
