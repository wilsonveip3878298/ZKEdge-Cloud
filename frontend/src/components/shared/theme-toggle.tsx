'use client';

import { Moon, Sun, Monitor } from 'lucide-react';
import { useThemeStore } from '@/store/theme-store';
import { DropdownMenu, DropdownItem } from '@/components/ui/dropdown-menu';

export function ThemeToggle() {
  const { theme, setTheme } = useThemeStore();

  const Icon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;

  return (
    <DropdownMenu trigger={
      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
        <Icon className="w-5 h-5 text-gray-600" />
      </button>
    }>
      <DropdownItem onClick={() => setTheme('light')}>
        <div className="flex items-center gap-2"><Sun className="w-4 h-4" /> Claro</div>
      </DropdownItem>
      <DropdownItem onClick={() => setTheme('dark')}>
        <div className="flex items-center gap-2"><Moon className="w-4 h-4" /> Oscuro</div>
      </DropdownItem>
      <DropdownItem onClick={() => setTheme('system')}>
        <div className="flex items-center gap-2"><Monitor className="w-4 h-4" /> Sistema</div>
      </DropdownItem>
    </DropdownMenu>
  );
}
