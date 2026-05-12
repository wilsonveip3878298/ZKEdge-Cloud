'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/data-tables/data-table';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { toast } from 'sonner';

interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLogin?: string;
}

const mockData: SystemUser[] = [
  { id: '1', name: 'Admin Principal', email: 'admin@sistema.com', role: 'super_admin', isActive: true, lastLogin: new Date().toISOString() },
  { id: '2', name: 'Gerente RRHH', email: 'rrhh@empresa.com', role: 'admin', isActive: true, lastLogin: new Date(Date.now() - 86400000).toISOString() },
  { id: '3', name: 'Usuario Viewer', email: 'viewer@empresa.com', role: 'viewer', isActive: true },
  { id: '4', name: 'Inactivo', email: 'inactivo@empresa.com', role: 'admin', isActive: false },
];

const roleOptions = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Gerente' },
  { value: 'viewer', label: 'Visor' },
];

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const filtered = mockData.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) || u.email.includes(search),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Usuarios del Sistema</h2>
          <p className="text-sm text-gray-500">Gestión de acceso al sistema</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>+ Nuevo Usuario</Button>
      </div>
      <DataTable
        columns={[
          { key: 'name', header: 'Nombre', sortable: true },
          { key: 'email', header: 'Email', sortable: true },
          { key: 'role', header: 'Rol', render: (u: SystemUser) => {
            const labels: Record<string, string> = { super_admin: 'Super Admin', admin: 'Admin', manager: 'Gerente', viewer: 'Visor' };
            return <Badge variant="info">{labels[u.role] || u.role}</Badge>;
          }},
          { key: 'isActive', header: 'Estado', render: (u: SystemUser) => <Badge variant={u.isActive ? 'success' : 'default'}>{u.isActive ? 'Activo' : 'Inactivo'}</Badge> },
          { key: 'lastLogin', header: 'Último Acceso', render: (u: SystemUser) => u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Nunca' },
        ]}
        data={filtered}
        keyExtractor={(u) => u.id}
      />
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Nuevo Usuario">
        <div className="space-y-4">
          <Input label="Nombre completo" placeholder="Nombre" />
          <Input label="Email" placeholder="email@empresa.com" type="email" />
          <Input label="Contraseña" type="password" placeholder="••••••••" />
          <Select label="Rol" options={roleOptions} />
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => { toast.success('Usuario creado'); setDialogOpen(false); }}>Guardar</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
