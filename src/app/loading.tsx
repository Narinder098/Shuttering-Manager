export default function Loading() {
  return (
    <main className="p-6 animate-pulse">
      
      {/* HERO */}
      <div className="h-40 sm:h-52 bg-gray-200 rounded-3xl mb-10"></div>

      {/* BUTTONS */}
      <div className="flex gap-4 justify-center mb-10">
        <div className="h-10 w-32 bg-gray-200 rounded-xl"></div>
        <div className="h-10 w-32 bg-gray-200 rounded-xl"></div>
      </div>

      {/* 3 FEATURES */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-40 bg-gray-200 rounded-2xl"></div>
        ))}
      </div>

    </main>
  );
}
