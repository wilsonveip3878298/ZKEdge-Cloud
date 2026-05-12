'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/data-tables/data-table';
import { Filters } from '@/components/data-tables/filters';
import { Card } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import type { AttendanceRecord } from '@/types';

const mockData: AttendanceRecord[] = [
  { id: '1', employeeId: 'EMP001', timestamp: new Date().toISOString(), type: 'check_in', deviceId: '1', companyId: '1', createdAt: new Date().toISOString() },
  { id: '2', employeeId: 'EMP002', timestamp: new Date().toISOString(), type: 'check_in', deviceId: '1', companyId: '1', createdAt: new Date().toISOString() },
  { id: '3', employeeId: 'EMP001', timestamp: new Date(Date.now() - 28800000).toISOString(), type: 'check_out', deviceId: '1', companyId: '1', createdAt: new Date().toISOString() },
  { id: '4', employeeId: 'EMP003', timestamp: new Date(Date.now() - 86400000).toISOString(), type: 'check_in', deviceId: '2', companyId: '1', createdAt: new Date().toISOString() },
];

export default function AttendancePage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateRange, setDateRange] = useState('today');

  const filtered = mockData.filter((a) => {
    const matchesSearch = a.employeeId.includes(search);
    const matchesType = !typeFilter || a.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Marcaciones</h2>
          <p className="text-sm text-gray-500">Registro de asistencia en tiempo real</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">Exportar</Button>
          <Button size="sm">+ Manual</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card title="Hoy" value="156" description="Marcaciones" />
        <Card title="Entradas" value="98" description="Check-in" />
        <Card title="Salidas" value="58" description="Check-out" />
        <Card title="Pendientes" value="12" description="Sin registrar" />
      </div>

      <Filters
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por ID empleado..."
        filters={[
          { key: 'type', label: 'Tipos', options: [{ value: 'check_in', label: 'Entradas' }, { value: 'check_out', label: 'Salidas' }], value: typeFilter, onChange: setTypeFilter },
        ]}
      />

      <DataTable
        columns={[
          { key: 'employeeId', header: 'Empleado', sortable: true },
          { key: 'type', header: 'Tipo', render: (a: AttendanceRecord) => <Badge variant={a.type === 'check_in' ? 'success' : 'info'}>{a.type === 'check_in' ? 'Entrada' : 'Salida'}</Badge> },
          { key: 'timestamp', header: 'Fecha/Hora', sortable: true, render: (a: AttendanceRecord) => formatDate(a.timestamp) },
        ]}
        data={filtered}
        keyExtractor={(a) => a.id}
        pageSize={10}
      />
    </div>
  );
}
