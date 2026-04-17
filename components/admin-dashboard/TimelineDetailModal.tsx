'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import type { TimelineItem } from '@/types/admin-dashboard';

export default function TimelineDetailModal({
  item,
  onClose,
  onUnfinalize,
}: {
  item: TimelineItem;
  onClose: () => void;
  onUnfinalize: (tahap: string) => Promise<void>;
}) {
  const [isUnfinalizing, setIsUnfinalizing] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getErrorMessage = (error: unknown) => {
    if (typeof error === 'object' && error !== null && 'response' in error) {
      const response = (error as { response?: { data?: { message?: string } } }).response;
      if (response?.data?.message) {
        return response.data.message;
      }
    }

    if (error instanceof Error && error.message) {
      return error.message;
    }

    return 'Gagal membuka kembali tahap. Silakan coba lagi.';
  };

  const handleUnfinalize = async () => {
    setPendingConfirm(false);
    setIsUnfinalizing(true);
    setErrorMessage(null);
    try {
      await onUnfinalize(item.tahap);
      onClose();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
      console.error('Gagal unfinalize:', error);
    } finally {
      setIsUnfinalizing(false);
    }
  };

  const canUnfinalize = item.status === 'completed' && item.tahap !== 'submission';

  const renderStatistik = () => {
    if (!item.statistik) return null;

    const stats = item.statistik;

    switch (item.tahap) {
      case 'submission':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Total Submission</div>
              <div className="text-2xl font-bold text-gray-900">{stats.total_submission || 0}</div>
            </div>
            <div className="bg-white border border-gray-200 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Terfinalisasi</div>
              <div className="text-2xl font-bold text-green-600">{stats.finalized || 0}</div>
            </div>
          </div>
        );
      case 'penilaian_slhd':
        return (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Total Dinilai</div>
              <div className="text-2xl font-bold text-gray-900">{stats.total_dinilai || 0}</div>
            </div>
            <div className="bg-white border border-gray-200 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Lolos</div>
              <div className="text-2xl font-bold text-green-600">{stats.lolos || 0}</div>
            </div>
            <div className="bg-white border border-gray-200 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Tidak Lolos</div>
              <div className="text-2xl font-bold text-red-600">{stats.tidak_lolos || 0}</div>
            </div>
          </div>
        );
      case 'penilaian_penghargaan':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Total Peserta</div>
              <div className="text-2xl font-bold text-gray-900">{stats.total_peserta || 0}</div>
            </div>
            <div className="bg-white border border-gray-200 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Masuk Penghargaan</div>
              <div className="text-2xl font-bold text-green-600">{stats.masuk_penghargaan || 0}</div>
            </div>
          </div>
        );
      case 'validasi_1':
      case 'validasi_2':
        return (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Total Peserta</div>
              <div className="text-2xl font-bold text-gray-900">{stats.total_peserta || 0}</div>
            </div>
            <div className="bg-white border border-gray-200 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Lolos</div>
              <div className="text-2xl font-bold text-green-600">{stats.lolos || 0}</div>
            </div>
            <div className="bg-white border border-gray-200 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Tidak Lolos</div>
              <div className="text-2xl font-bold text-red-600">{stats.tidak_lolos || 0}</div>
            </div>
          </div>
        );
      case 'wawancara':
        return (
          <div className="bg-white border border-gray-200 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Total Peserta</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total_peserta || 0}</div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden"
          onClick={(event) => event.stopPropagation()}
        >
          <div
            className={`p-6 ${
              item.status === 'completed' ? 'bg-green-500' : item.status === 'active' ? 'bg-yellow-500' : 'bg-gray-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  {item.status === 'completed' ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : item.status === 'active' ? (
                    <Clock className="w-5 h-5 text-white" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{item.label}</h3>
                  <span
                    className={`text-sm ${
                      item.status === 'completed' ? 'text-green-100' : item.status === 'active' ? 'text-yellow-100' : 'text-gray-200'
                    }`}
                  >
                    {item.status === 'completed' ? 'Selesai' : item.status === 'active' ? 'Sedang Berjalan' : 'Belum Dimulai'}
                  </span>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {item.deadline && (
              <div className={`p-4 rounded-lg ${item.deadline.is_passed ? 'bg-red-50' : 'bg-blue-50'}`}>
                <div className={`text-sm ${item.deadline.is_passed ? 'text-red-600' : 'text-blue-600'}`}>Deadline</div>
                <div className={`text-lg font-semibold ${item.deadline.is_passed ? 'text-red-800' : 'text-blue-800'}`}>
                  {item.deadline.tanggal_formatted}
                </div>
                {item.deadline.is_passed && <div className="text-sm text-red-600 mt-1">⚠️ Deadline telah terlewat</div>}
              </div>
            )}

            {renderStatistik()}

            {canUnfinalize && (
              <div className="pt-4 border-t">
                {pendingConfirm ? (
                  <div className="space-y-3">
                    <p className="text-sm text-orange-700 font-medium text-center">
                      Yakin ingin membuka kembali tahap &ldquo;{item.label}&rdquo;?
                    </p>
                    <p className="text-xs text-gray-500 text-center">
                      Ini akan mengembalikan tahap ke status aktif dan membuka akses edit.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setPendingConfirm(false);
                          setErrorMessage(null);
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
                      >
                        Batal
                      </button>
                      <button
                        onClick={handleUnfinalize}
                        disabled={isUnfinalizing}
                        className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                      >
                        {isUnfinalizing ? 'Memproses...' : 'Ya, Buka'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setPendingConfirm(true);
                        setErrorMessage(null);
                      }}
                      disabled={isUnfinalizing}
                      className="w-full px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isUnfinalizing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Memproses...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          Buka Kembali Tahap Ini
                        </>
                      )}
                    </button>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Ini akan mengembalikan tahap ke status aktif dan membuka akses edit
                    </p>
                  </>
                )}

                {errorMessage && (
                  <p className="mt-3 text-sm text-red-600 text-center">{errorMessage}</p>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
