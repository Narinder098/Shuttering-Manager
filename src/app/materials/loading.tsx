export default function Loading() {
  return (
    <div className="p-6 grid grid-cols-2 sm:grid-cols-5 gap-4 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="h-40 bg-gray-200 rounded-xl"
        ></div>
      ))}
    </div>
  );
}
