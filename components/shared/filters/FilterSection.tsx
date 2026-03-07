'use client';

import type { ReactNode } from 'react';
import clsx from 'clsx';

interface FilterSectionProps {
  children: ReactNode;
  className?: string;
}

export default function FilterSection({ children, className }: FilterSectionProps) {
  return <div className={clsx('flex flex-wrap gap-4 items-end', className)}>{children}</div>;
}
