'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/data-tables/data-table';
import { Filters } from '@/components/data-tables/filters';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import type { Company } from '@/types';

const mockData: Company[] = [
  { id: '1', name: 'Corporación ABC', slug: 'abc-corp', taxId: 'ABC-123456', isActive: true, createdAt: '2024-01-15' },
  { id: '2', name: 'Empresa XYZ', slug: 'xyz-sa', taxId: 'XYZ-789012', isActive: true, createdAt: '2024-02-20' },
  { id: '3', name: 'Grupo Delta', slug: 'delta', taxId: 'DEL-345678', isActive: false, createdAt: '2024-03-10' },
];

export default function CompaniesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const filtered = mockData.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || (statusFilter === 'active' ? c.isActive : !c.isActive);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Empresas</h2>
          <p className="text-sm text-gray-500">Gestión multiempresa</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>+ Nueva Empresa</Button>
      </div>

      <Filters
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar empresa..."
        filters={[
          { key: 'status', label: 'Estado', options: [{ value: 'active', label: 'Activas' }, { value: 'inactive', label: 'Inactivas' }], value: statusFilter, onChange: setStatusFilter },
        ]}
      />

      <DataTable
        columns={[
          { key: 'name', header: 'Nombre', sortable: true },
          { key: 'slug', header: 'Slug', sortable: true },
          { key: 'taxId', header: 'RFC' },
          {
            key: 'isActive',
            header: 'Estado',
            render: (c: Company) => <Badge variant={c.isActive ? 'success' : 'default'}>{c.isActive ? 'Activa' : 'Inactiva'}</Badge>,
          },
          { key: 'createdAt', header: 'Creada', sortable: true },
        ]}
        data={filtered}
        keyExtractor={(c) => c.id}
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Nueva Empresa">
        <div className="space-y-4">
          <Input label="Nombre" placeholder="Nombre de la empresa" />
          <Input label="RFC" placeholder="RFC" />
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => { toast.success('Empresa creada'); setDialogOpen(false); }}>Guardar</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
