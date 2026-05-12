'use client';

import { useState } from 'react';
import { Shield, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Permission {
  id: string;
  label: string;
  key: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  userCount: number;
  permissions: string[];
}

const allPermissions: Permission[] = [
  { id: '1', label: 'Ver Dashboard', key: 'dashboard:view' },
  { id: '2', label: 'Gestionar Empresas', key: 'companies:manage' },
  { id: '3', label: 'Gestionar Sucursales', key: 'branches:manage' },
  { id: '4', label: 'Gestionar Dispositivos', key: 'devices:manage' },
  { id: '5', label: 'Gestionar Empleados', key: 'employees:manage' },
  { id: '6', label: 'Ver Marcaciones', key: 'attendance:view' },
  { id: '7', label: 'Gestionar Horarios', key: 'schedules:manage' },
  { id: '8', label: 'Ver Reportes', key: 'reports:view' },
  { id: '9', label: 'Exportar Datos', key: 'data:export' },
  { id: '10', label: 'Gestionar Usuarios', key: 'users:manage' },
];

const mockRoles: Role[] = [
  { id: '1', name: 'Super Admin', description: 'Acceso total al sistema', userCount: 1, permissions: allPermissions.map((p) => p.key) },
  { id: '2', name: 'Admin', description: 'Administración de empresa', userCount: 3, permissions: ['dashboard:view', 'companies:manage', 'branches:manage', 'devices:manage', 'employees:manage', 'attendance:view', 'schedules:manage', 'reports:view', 'data:export'] },
  { id: '3', name: 'Gerente', description: 'Visión general y reportes', userCount: 5, permissions: ['dashboard:view', 'attendance:view', 'reports:view', 'employees:manage'] },
  { id: '4', name: 'Visor', description: 'Solo lectura', userCount: 8, permissions: ['dashboard:view', 'attendance:view', 'reports:view'] },
];

export default function RolesPage() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Roles y Permisos</h2>
        <p className="text-sm text-gray-500">RBAC - Control de acceso basado en roles</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {mockRoles.map((role) => (
          <Card
            key={role.id}
            className={cn(
              'p-4 cursor-pointer border-2 transition-all hover:shadow-md',
              selectedRole === role.id ? 'border-primary-500 bg-primary-50' : 'border-transparent',
            )}
            onClick={() => setSelectedRole(role.id)}
          >
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-primary-500" />
              <h3 className="font-semibold">{role.name}</h3>
            </div>
            <p className="text-xs text-gray-500 mb-2">{role.description}</p>
            <Badge>{role.userCount} usuarios</Badge>
          </Card>
        ))}
      </div>

      {selectedRole && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Permisos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {allPermissions.map((perm) => {
              const role = mockRoles.find((r) => r.id === selectedRole);
              const hasPermission = role?.permissions.includes(perm.key);
              return (
                <div
                  key={perm.id}
                  className={cn(
                    'flex items-center gap-2 p-3 rounded-lg border transition-colors',
                    hasPermission ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200 opacity-60',
                  )}
                >
                  <div className={cn('w-5 h-5 rounded flex items-center justify-center', hasPermission ? 'bg-green-500' : 'bg-gray-300')}>
                    {hasPermission && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-sm">{perm.label}</span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline">Cancelar</Button>
            <Button>Guardar Permisos</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
