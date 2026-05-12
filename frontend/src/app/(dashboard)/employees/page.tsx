'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/data-tables/data-table';
import { Filters } from '@/components/data-tables/filters';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { toast } from 'sonner';
import type { Employee } from '@/types';

const mockData: Employee[] = [
  { id: '1', employeeId: 'EMP001', firstName: 'Juan', lastName: 'Pérez', cardNumber: '12345', email: 'juan@empresa.com', department: 'TI', position: 'Desarrollador', companyId: '1', branchId: '1', isActive: true, createdAt: '2024-01-15' },
  { id: '2', employeeId: 'EMP002', firstName: 'María', lastName: 'García', cardNumber: '12346', email: 'maria@empresa.com', department: 'RRHH', position: 'Analista', companyId: '1', branchId: '1', isActive: true, createdAt: '2024-01-20' },
  { id: '3', employeeId: 'EMP003', firstName: 'Carlos', lastName: 'López', cardNumber: '12347', email: 'carlos@empresa.com', department: 'TI', position: 'Soporte', companyId: '1', branchId: '2', isActive: true, createdAt: '2024-02-01' },
  { id: '4', employeeId: 'EMP004', firstName: 'Ana', lastName: 'Martínez', email: 'ana@empresa.com', department: 'Ventas', position: 'Ejecutivo', companyId: '1', branchId: '1', isActive: false, createdAt: '2024-02-15' },
];

export default function EmployeesPage() {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const departments = [...new Set(mockData.map((e) => e.department).filter(Boolean))];

  const filtered = mockData.filter((e) => {
    const name = `${e.firstName} ${e.lastName}`.toLowerCase();
    const matchesSearch = name.includes(search.toLowerCase()) || e.employeeId.includes(search);
    const matchesDept = !deptFilter || e.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Empleados</h2>
          <p className="text-sm text-gray-500">{mockData.length} registrados</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>+ Nuevo Empleado</Button>
      </div>

      <Filters
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nombre o ID..."
        filters={[
          { key: 'department', label: 'Departamentos', options: departments.map((d) => ({ value: d!, label: d! })), value: deptFilter, onChange: setDeptFilter },
        ]}
      />

      <DataTable
        columns={[
          { key: 'employeeId', header: 'ID', sortable: true },
          { key: 'firstName', header: 'Nombre', sortable: true, render: (e: Employee) => `${e.firstName} ${e.lastName}` },
          { key: 'department', header: 'Departamento', sortable: true },
          { key: 'position', header: 'Puesto' },
          { key: 'email', header: 'Email', className: 'hidden lg:table-cell' },
          { key: 'isActive', header: 'Estado', render: (e: Employee) => <Badge variant={e.isActive ? 'success' : 'default'}>{e.isActive ? 'Activo' : 'Inactivo'}</Badge> },
        ]}
        data={filtered}
        keyExtractor={(e) => e.id}
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Nuevo Empleado">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="ID Empleado" placeholder="EMP001" />
            <Input label="Número de Tarjeta" placeholder="12345" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Nombre" placeholder="Nombre" />
            <Input label="Apellido" placeholder="Apellido" />
          </div>
          <Input label="Email" placeholder="email@empresa.com" type="email" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Departamento" placeholder="TI" />
            <Input label="Puesto" placeholder="Desarrollador" />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => { toast.success('Empleado creado'); setDialogOpen(false); }}>Guardar</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
