'use client';

import { useState } from 'react';
import { Building2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/data-tables/data-table';
import { Filters } from '@/components/data-tables/filters';
import { toast } from 'sonner';
import type { Branch } from '@/types';

const mockData: Branch[] = [
  { id: '1', name: 'Sucursal Centro', address: 'Av. Principal 123', city: 'CDMX', companyId: '1', isActive: true, createdAt: '2024-01-15' },
  { id: '2', name: 'Sucursal Norte', address: 'Blvd. Norte 456', city: 'Monterrey', companyId: '1', isActive: true, createdAt: '2024-02-20' },
  { id: '3', name: 'Sucursal Sur', address: 'Calle Sur 789', city: 'CDMX', companyId: '2', isActive: false, createdAt: '2024-03-10' },
];

export default function BranchesPage() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const filtered = mockData.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.city?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sucursales</h2>
          <p className="text-sm text-gray-500">Administración de sucursales</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>+ Nueva Sucursal</Button>
      </div>

      <Filters search={search} onSearchChange={setSearch} searchPlaceholder="Buscar sucursal o ciudad..." />

      <DataTable
        columns={[
          { key: 'name', header: 'Nombre', sortable: true },
          { key: 'address', header: 'Dirección', className: 'max-w-xs truncate' },
          {
            key: 'city', header: 'Ciudad', sortable: true, render: (b: Branch) => (
              <div className="flex items-center gap-1"><MapPin className="w-3 h-3 text-gray-400" />{b.city}</div>
            ),
          },
          { key: 'isActive', header: 'Estado', render: (b: Branch) => <Badge variant={b.isActive ? 'success' : 'default'}>{b.isActive ? 'Activa' : 'Inactiva'}</Badge> },
        ]}
        data={filtered}
        keyExtractor={(b) => b.id}
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Nueva Sucursal">
        <div className="space-y-4">
          <Input label="Nombre" placeholder="Nombre de la sucursal" />
          <Input label="Dirección" placeholder="Dirección" />
          <Input label="Ciudad" placeholder="Ciudad" />
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => { toast.success('Sucursal creada'); setDialogOpen(false); }}>Guardar</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
