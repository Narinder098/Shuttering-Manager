export default function Loading() {
  return (
    <main className="p-6 animate-pulse">
      
      {/* TOP BAR */}
      <div className="
        sticky top-16
        bg-gray-100/80 rounded-2xl p-5 shadow
        mb-10 border border-gray-200
      ">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          <div className="h-12 bg-gray-300 rounded-xl"></div>
          <div className="h-12 bg-gray-300 rounded-xl"></div>
          <div className="h-12 bg-gray-300 rounded-xl"></div>
          <div className="h-12 bg-gray-300 rounded-xl"></div>
          <div className="h-12 bg-gray-300 rounded-xl"></div>
        </div>
      </div>

      {/* MATERIAL CARDS */}
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-gray-200 h-40 rounded-2xl w-full"
          ></div>
        ))}
      </div>

      {/* TOTAL SECTION */}
      <div className="h-24 bg-gray-200 rounded-2xl mt-10"></div>

    </main>
  );
}
