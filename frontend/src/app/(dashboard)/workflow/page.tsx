'use client';

import { useState } from 'react';
import { CalendarCheck, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/data-tables/data-table';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { toast } from 'sonner';

interface HRRequest {
  id: string; employee: string; type: string; startDate: string; endDate: string; days: number; status: string;
}

const mockRequests: HRRequest[] = [
  { id: '1', employee: 'Juan Pérez', type: 'vacation', startDate: '2026-06-01', endDate: '2026-06-15', days: 15, status: 'pending' },
  { id: '2', employee: 'María García', type: 'permit', startDate: '2026-05-20', endDate: '2026-05-20', days: 1, status: 'approved' },
  { id: '3', employee: 'Carlos López', type: 'vacation', startDate: '2026-07-01', endDate: '2026-07-10', days: 10, status: 'approved' },
  { id: '4', employee: 'Ana Martínez', type: 'justification', startDate: '2026-05-18', endDate: '2026-05-18', days: 1, status: 'pending' },
];

export default function WorkflowPage() {
  const [requests] = useState(mockRequests);
  const [dialogOpen, setDialogOpen] = useState(false);

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  const typeLabels: Record<string, string> = { vacation: 'Vacaciones', permit: 'Permiso', justification: 'Justificación', advance: 'Anticipo' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">Workflow RRHH</h2><p className="text-sm text-gray-500">Solicitudes y aprobaciones</p></div>
        <Button onClick={() => setDialogOpen(true)}>+ Nueva Solicitud</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card title="Pendientes" value={pendingCount} icon={<Clock className="w-6 h-6 text-yellow-500" />} />
        <Card title="Aprobadas" value={requests.filter(r => r.status === 'approved').length} icon={<CheckCircle className="w-6 h-6 text-green-500" />} />
        <Card title="Vacaciones" value={requests.filter(r => r.type === 'vacation').length} icon={<CalendarCheck className="w-6 h-6" />} />
        <Card title="Permisos" value={requests.filter(r => r.type === 'permit').length} icon={<Clock className="w-6 h-6" />} />
      </div>

      <DataTable
        columns={[
          { key: 'employee', header: 'Empleado', sortable: true },
          { key: 'type', header: 'Tipo', render: (r: HRRequest) => <Badge>{typeLabels[r.type] || r.type}</Badge> },
          { key: 'startDate', header: 'Inicio', sortable: true },
          { key: 'endDate', header: 'Fin' },
          { key: 'days', header: 'Días' },
          { key: 'status', header: 'Estado', render: (r: HRRequest) => <Badge variant={r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'error' : 'warning'}>{r.status}</Badge> },
        ]}
        data={requests}
        keyExtractor={(r) => r.id}
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Nueva Solicitud">
        <div className="space-y-4">
          <Select label="Tipo" options={[{ value: 'vacation', label: 'Vacaciones' }, { value: 'permit', label: 'Permiso' }, { value: 'justification', label: 'Justificación' }]} />
          <Input label="Fecha Inicio" type="date" />
          <Input label="Fecha Fin" type="date" />
          <Input label="Motivo" placeholder="Describa el motivo..." />
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => { toast.success('Solicitud creada'); setDialogOpen(false); }}>Enviar</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
