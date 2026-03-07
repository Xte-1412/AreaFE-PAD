'use client';

import { useId, type ReactNode } from 'react';
import clsx from 'clsx';

interface AppModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children?: ReactNode;
  actions?: ReactNode;
  maxWidthClassName?: string;
  panelClassName?: string;
  closeOnBackdrop?: boolean;
}

export function AppModal({
  isOpen,
  onClose,
  title,
  children,
  actions,
  maxWidthClassName = 'max-w-md',
  panelClassName,
  closeOnBackdrop = true,
}: AppModalProps) {
  const titleId = useId();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby={title ? titleId : undefined} aria-label={!title ? 'Dialog' : undefined}>
      <div
        className="absolute inset-0 bg-black/50"
        onClick={closeOnBackdrop ? onClose : undefined}
      />

      <div
        className={clsx(
          'relative bg-white rounded-xl shadow-2xl w-full mx-4',
          maxWidthClassName,
          panelClassName
        )}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Tutup modal"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6">
          {title && <h3 id={titleId} className="text-lg font-bold text-gray-900 pr-8">{title}</h3>}
          {children && <div className={clsx(title ? 'mt-2' : '')}>{children}</div>}
          {actions && <div className="mt-6">{actions}</div>}
        </div>
      </div>
    </div>
  );
}

export type { AppModalProps };
