'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

interface FilterOption {
  value: string;
  label: string;
}

interface FiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder?: string;
  filters?: {
    key: string;
    label: string;
    options: FilterOption[];
    value: string;
    onChange: (v: string) => void;
  }[];
}

export function Filters({ search, onSearchChange, searchPlaceholder = 'Buscar...', filters }: FiltersProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="pl-10 pr-4 h-10 border rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
      {filters?.map((f) => (
        <Select
          key={f.key}
          value={f.value}
          onChange={(e) => f.onChange(e.target.value)}
          options={[{ value: '', label: `Todos ${f.label}` }, ...f.options]}
          className="w-44"
        />
      ))}
    </div>
  );
}
