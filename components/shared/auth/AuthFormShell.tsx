import type { ReactNode } from 'react';

interface AuthFormShellProps {
  title: string;
  subtitle?: string;
  logo?: ReactNode;
  errorMessage?: string | null;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export default function AuthFormShell({
  title,
  subtitle,
  logo,
  errorMessage,
  children,
  footer,
  className,
}: AuthFormShellProps) {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen py-12 px-4 space-y-8">
      {logo && <div className="flex justify-center">{logo}</div>}

      <div className={`bg-white p-8 sm:p-10 rounded-xl shadow-xl w-full max-w-md text-center border border-gray-300 ${className ?? ''}`.trim()}>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{title}</h1>
        {subtitle && <p className="text-sm text-gray-600 mb-6">{subtitle}</p>}

        {errorMessage && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
            role="alert"
          >
            <span className="block sm:inline">{errorMessage}</span>
          </div>
        )}

        {children}

        {footer && <div className="mt-8 text-sm text-center">{footer}</div>}
      </div>
    </main>
  );
}
