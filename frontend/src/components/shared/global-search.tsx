'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Command } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/use-debounce';

const searchRoutes = [
  { label: 'Dashboard', href: '/dashboard', keywords: 'inicio principal' },
  { label: 'Empresas', href: '/companies', keywords: 'compañías empresas' },
  { label: 'Sucursales', href: '/branches', keywords: 'sucursales locales' },
  { label: 'Dispositivos', href: '/devices', keywords: 'equipos biométricos zkteco' },
  { label: 'Empleados', href: '/employees', keywords: 'empleados trabajadores personal' },
  { label: 'Marcaciones', href: '/attendance', keywords: 'asistencia marcaciones checadas' },
  { label: 'Horarios', href: '/schedules', keywords: 'horarios turnos' },
  { label: 'Reportes', href: '/reports', keywords: 'reportes estadísticas' },
  { label: 'Usuarios', href: '/users', keywords: 'usuarios del sistema' },
  { label: 'Roles', href: '/roles', keywords: 'roles permisos' },
  { label: 'Configuración', href: '/settings', keywords: 'configuración ajustes' },
];

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const results = searchRoutes.filter(
    (r) =>
      r.label.toLowerCase().includes(debounced.toLowerCase()) ||
      r.keywords.toLowerCase().includes(debounced.toLowerCase()),
  );

  const navigate = (href: string) => {
    router.push(href);
    setOpen(false);
    setQuery('');
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 w-96 px-3 py-2 bg-gray-50 border rounded-lg text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >
        <Search className="w-4 h-4" />
        <span>Buscar...</span>
        <kbd className="ml-auto flex items-center gap-1 text-xs bg-gray-200 px-1.5 py-0.5 rounded">
          <Command className="w-3 h-3" />K
        </kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-[15%]"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 p-4 border-b">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar páginas..."
                className="flex-1 text-sm outline-none"
              />
              <kbd className="text-xs bg-gray-100 px-2 py-0.5 rounded">ESC</kbd>
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {results.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Sin resultados</p>
              ) : (
                results.map((r) => (
                  <button
                    key={r.href}
                    onClick={() => navigate(r.href)}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                  >
                    {r.label}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
