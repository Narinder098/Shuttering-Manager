export default function Loading() {
  return (
    <main className="animate-pulse">

      {/* HEADER */}
      <div className="h-40 bg-gray-300 w-full"></div>

      {/* CONTACT CARDS */}
      <div className="max-w-6xl mx-auto px-6 -mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-40 bg-gray-200 rounded-2xl"></div>
        ))}
      </div>

      {/* FORM + MAP */}
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* Form Skeleton */}
        <div className="h-80 bg-gray-200 rounded-3xl"></div>

        {/* Map Skeleton */}
        <div className="h-80 bg-gray-200 rounded-3xl"></div>

      </div>

    </main>
  );
}
