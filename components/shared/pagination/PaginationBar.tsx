import type { ReactNode } from 'react';
import clsx from 'clsx';

interface PaginationBarProps {
  page: number;
  totalPages: number;
  totalItems: number;
  perPage?: number;
  onPageChange: (nextPage: number) => void;
  prevIcon?: ReactNode;
  nextIcon?: ReactNode;
  className?: string;
}

export default function PaginationBar({
  page,
  totalPages,
  totalItems,
  perPage = 15,
  onPageChange,
  prevIcon,
  nextIcon,
  className,
}: PaginationBarProps) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, totalItems);

  return (
    <div
      className={clsx(
        'flex items-center justify-between bg-white px-6 py-4 rounded-xl border border-gray-200 shadow-sm',
        className
      )}
    >
      <p className="text-sm text-gray-600">
        Menampilkan <span className="font-semibold">{from}</span> - <span className="font-semibold">{to}</span> dari{' '}
        <span className="font-semibold">{totalItems}</span> data
      </p>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Halaman sebelumnya"
          type="button"
        >
          {prevIcon ?? '<'}
        </button>

        <span className="px-4 py-2 text-sm font-medium text-gray-700">
          {page} / {totalPages}
        </span>

        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Halaman selanjutnya"
          type="button"
        >
          {nextIcon ?? '>'}
        </button>
      </div>
    </div>
  );
}
