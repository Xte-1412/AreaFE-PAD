import type { SelectHTMLAttributes } from 'react';
import clsx from 'clsx';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label: string;
  options: FilterOption[];
  wrapperClassName?: string;
}

export default function FilterSelect({
  label,
  options,
  wrapperClassName,
  className,
  ...rest
}: FilterSelectProps) {
  return (
    <div className={clsx('w-48', wrapperClassName)}>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <select
        className={clsx(
          'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-green-500 focus:border-green-500',
          className
        )}
        {...rest}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
