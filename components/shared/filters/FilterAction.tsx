import type { ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

interface FilterActionProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
}

export default function FilterAction({ label = 'Filter', className, ...rest }: FilterActionProps) {
  return (
    <button
      className={clsx(
        'px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      {...rest}
    >
      {label}
    </button>
  );
}
