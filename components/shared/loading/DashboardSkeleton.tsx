type DashboardSkeletonVariant = 'layout' | 'admin' | 'dlh' | 'pusdatin';

interface DashboardSkeletonProps {
  variant?: DashboardSkeletonVariant;
}

export default function DashboardSkeleton({ variant = 'layout' }: DashboardSkeletonProps) {
  if (variant === 'layout') {
    return (
      <div className="p-8 space-y-6 min-h-screen">
        <div className="h-8 w-72 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="h-28 bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-28 bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-28 bg-gray-200 rounded-xl animate-pulse" />
        </div>
        <div className="h-64 bg-gray-200 rounded-xl animate-pulse" />
        <div className="h-40 bg-gray-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (variant === 'pusdatin') {
    return (
      <div className="space-y-6 px-8 pb-10">
        <header className="mb-2 space-y-2">
          <div className="h-8 w-72 bg-gray-200 rounded animate-pulse" />
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="h-28 bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-28 bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-28 bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-28 bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-28 bg-gray-200 rounded-xl animate-pulse" />
        </section>

        <section>
          <div className="h-5 w-44 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="h-40 bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-40 bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-40 bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-40 bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-40 bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-40 bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-40 bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-40 bg-gray-200 rounded-xl animate-pulse" />
          </div>
        </section>

        <section>
          <div className="h-5 w-64 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="h-64 bg-gray-200 rounded-xl animate-pulse" />
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-2">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="h-8 w-72 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-60 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="h-10 w-28 bg-gray-200 rounded-lg animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="h-28 bg-gray-200 rounded-xl animate-pulse" />
        <div className="h-28 bg-gray-200 rounded-xl animate-pulse" />
        <div className="h-28 bg-gray-200 rounded-xl animate-pulse" />
        <div className="h-28 bg-gray-200 rounded-xl animate-pulse" />
      </div>
      <div className="h-72 bg-gray-200 rounded-xl animate-pulse" />
      <div className="h-72 bg-gray-200 rounded-xl animate-pulse" />
    </div>
  );
}
