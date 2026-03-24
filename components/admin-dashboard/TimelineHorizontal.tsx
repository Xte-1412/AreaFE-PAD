'use client';

import type { ReactNode } from 'react';
import type { TimelineItem } from '@/types/admin-dashboard';

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default function TimelineHorizontal({
  items,
  year,
  onItemClick,
}: {
  items: TimelineItem[];
  year: number;
  onItemClick: (item: TimelineItem) => void;
}) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h3 className="font-bold text-lg text-gray-800 mb-6">Timeline Proses Penilaian {year}</h3>
      <div className="relative">
        <div className="absolute top-5 left-0 w-full h-0.5 bg-gray-200" />

        <div className="flex justify-between items-start relative">
          {items.map((item, index) => {
            let iconBg = 'bg-gray-100 border-2 border-gray-300 text-gray-400';
            let iconContent: ReactNode = <ClockIcon />;

            if (item.status === 'completed') {
              iconBg = 'bg-green-100 border-2 border-green-500 text-green-600';
              iconContent = <CheckIcon />;
            } else if (item.status === 'active') {
              iconBg = 'bg-yellow-100 border-2 border-yellow-500 text-yellow-600';
              iconContent = <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />;
            }

            return (
              <div
                key={index}
                className="flex flex-col items-center z-10 cursor-pointer group"
                style={{ width: `${100 / items.length}%` }}
                onClick={() => onItemClick(item)}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconBg} transition-transform group-hover:scale-110`}>
                  {iconContent}
                </div>
                <p
                  className={`text-xs mt-2 text-center font-medium px-1 group-hover:text-green-600 transition-colors ${
                    item.status === 'completed' ? 'text-green-700' : item.status === 'active' ? 'text-yellow-700' : 'text-gray-500'
                  }`}
                >
                  {item.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
