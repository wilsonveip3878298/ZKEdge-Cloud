'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Building2, Monitor, Users, Clock, FileBarChart, Settings, LogOut,
  CalendarClock, UserCog, Shield, ChevronLeft,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useUIStore } from '@/store/ui-store';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const mainNav: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/companies', label: 'Empresas', icon: Building2 },
  { href: '/branches', label: 'Sucursales', icon: Building2 },
  { href: '/devices', label: 'Dispositivos', icon: Monitor, badge: '12 en línea' },
  { href: '/edge', label: 'Edge Computing', icon: Monitor },
  { href: '/employees', label: 'Empleados', icon: Users },
  { href: '/attendance', label: 'Marcaciones', icon: Clock },
  { href: '/schedules', label: 'Horarios', icon: CalendarClock },
  { href: '/workflow', label: 'Workflow RRHH', icon: CalendarClock },
  { href: '/payroll', label: 'Planillas', icon: FileBarChart },
  { href: '/hr-analytics', label: 'Analytics RRHH', icon: FileBarChart },
  { href: '/reports', label: 'Reportes', icon: FileBarChart },
];

const adminNav: NavItem[] = [
  { href: '/users', label: 'Usuarios', icon: UserCog },
  { href: '/roles', label: 'Roles', icon: Shield },
  { href: '/settings', label: 'Configuración', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  const NavItemComponent = ({ item }: { item: NavItem }) => {
    const Icon = item.icon;
    const isActive = pathname.startsWith(item.href);
    return (
      <Link
        href={item.href}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
          isActive
            ? 'bg-primary-50 text-primary-700 font-medium'
            : 'text-gray-600 hover:bg-gray-50',
        )}
      >
        <Icon className="w-5 h-5 shrink-0" />
        {item.label}
        {item.badge && (
          <span className="ml-auto text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <aside className={cn(
      'bg-white border-r min-h-screen flex flex-col transition-all duration-300',
      sidebarOpen ? 'w-64' : 'w-16',
    )}>
      <div className="flex items-center justify-between p-4 border-b">
        {sidebarOpen && (
          <div>
            <h1 className="text-xl font-bold text-primary-600">Sistema</h1>
            <p className="text-xs text-gray-400">Biometric Cloud</p>
          </div>
        )}
        <button onClick={toggleSidebar} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronLeft className={cn('w-4 h-4 text-gray-400 transition-transform', !sidebarOpen && 'rotate-180')} />
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <p className={cn('text-xs font-medium text-gray-400 uppercase px-3 py-1', !sidebarOpen && 'hidden')}>
          Principal
        </p>
        {mainNav.map((item) => <NavItemComponent key={item.href} item={item} />)}

        <div className={cn('my-3 border-t', !sidebarOpen && 'hidden')} />

        <p className={cn('text-xs font-medium text-gray-400 uppercase px-3 py-1', !sidebarOpen && 'hidden')}>
          Administración
        </p>
        {adminNav.map((item) => <NavItemComponent key={item.href} item={item} />)}
      </nav>

      <div className="p-3 border-t">
        {sidebarOpen && (
          <div className="px-3 py-2 text-xs text-gray-400 truncate mb-1">{user?.email}</div>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg w-full transition-colors"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {sidebarOpen && 'Cerrar Sesión'}
        </button>
      </div>
    </aside>
  );
}
