export function SkeletonLine({ className = '' }) {
  return <div className={`skeleton h-4 rounded-md ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="skeleton w-10 h-10 rounded-xl" />
        <div className="flex-1">
          <div className="skeleton h-4 w-32 rounded-md mb-2" />
          <div className="skeleton h-3 w-48 rounded-md" />
        </div>
      </div>
      <div className="skeleton h-3 w-full rounded-md" />
      <div className="skeleton h-3 w-3/4 rounded-md" />
    </div>
  );
}

export function SkeletonGrid({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="animate-fade-in">
      <div className="skeleton h-8 w-48 rounded-lg mb-2" />
      <div className="skeleton h-4 w-64 rounded-md mb-8" />
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-24 rounded-2xl" />
        ))}
      </div>
      <div className="skeleton h-6 w-32 rounded-md mb-4" />
      <div className="grid grid-cols-2 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-40 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
