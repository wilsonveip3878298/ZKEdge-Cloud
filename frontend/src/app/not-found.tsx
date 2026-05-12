import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary-600 mb-4">404</h1>
        <h2 className="text-xl font-semibold mb-2">Página no encontrada</h2>
        <p className="text-gray-500 mb-6">La página que buscas no existe o fue movida.</p>
        <Link
          href="/dashboard"
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Volver al Dashboard
        </Link>
      </div>
    </div>
  );
}
