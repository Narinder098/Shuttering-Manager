export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-blue-50 to-white text-center px-6">
      <h1 className="text-6xl font-extrabold text-blue-700">404</h1>
      <p className="mt-4 text-gray-600 text-lg">
        Page not found. Maybe it's under construction 🛠️
      </p>

      <a
        href="/"
        className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md"
      >
        Go Home
      </a>
    </div>
  );
}
