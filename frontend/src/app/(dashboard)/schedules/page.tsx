'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/data-tables/data-table';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface Schedule {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  tolerance: number;
  days: string[];
  isActive: boolean;
}

const mockData: Schedule[] = [
  { id: '1', name: 'Horario Matutino', startTime: '08:00', endTime: '17:00', tolerance: 15, days: ['Lun', 'Mar', 'Mie', 'Jue', 'Vie'], isActive: true },
  { id: '2', name: 'Horario Vespertino', startTime: '14:00', endTime: '22:00', tolerance: 10, days: ['Lun', 'Mar', 'Mie', 'Jue', 'Vie'], isActive: true },
  { id: '3', name: 'Horario Sabatino', startTime: '09:00', endTime: '14:00', tolerance: 15, days: ['Sab'], isActive: false },
];

export default function SchedulesPage() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const filtered = mockData.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Horarios</h2>
          <p className="text-sm text-gray-500">Gestión de turnos y jornadas</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>+ Nuevo Horario</Button>
      </div>
      <DataTable
        columns={[
          { key: 'name', header: 'Nombre', sortable: true },
          { key: 'startTime', header: 'Entrada', sortable: true },
          { key: 'endTime', header: 'Salida', sortable: true },
          { key: 'tolerance', header: 'Tolerancia (min)', render: (s: Schedule) => `${s.tolerance} min` },
          { key: 'days', header: 'Días', render: (s: Schedule) => s.days.join(', ') },
          { key: 'isActive', header: 'Estado', render: (s: Schedule) => <Badge variant={s.isActive ? 'success' : 'default'}>{s.isActive ? 'Activo' : 'Inactivo'}</Badge> },
        ]}
        data={filtered}
        keyExtractor={(s) => s.id}
      />
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Nuevo Horario">
        <div className="space-y-4">
          <Input label="Nombre" placeholder="Ej: Horario Matutino" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Hora Entrada" type="time" />
            <Input label="Hora Salida" type="time" />
          </div>
          <Input label="Tolerancia (minutos)" type="number" placeholder="15" />
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => { toast.success('Horario creado'); setDialogOpen(false); }}>Guardar</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
