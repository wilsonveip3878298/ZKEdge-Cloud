'use client';

import { useState } from 'react';
import { Monitor, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DataTable } from '@/components/data-tables/data-table';
import { Filters } from '@/components/data-tables/filters';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useRealtime } from '@/hooks/use-realtime';
import { cn } from '@/lib/utils';
import type { Device } from '@/types';

const mockData: Device[] = [
  { id: '1', name: 'ZK-Face-001', serialNumber: 'ZK-001', model: 'Face ID 7', firmwareVersion: '6.60', ipAddress: '192.168.1.100', port: 4370, status: 'online', branchId: '1', lastSyncAt: new Date().toISOString(), lastSeenAt: new Date().toISOString(), createdAt: '2024-01-10' },
  { id: '2', name: 'ZK-Finger-001', serialNumber: 'ZK-002', model: 'K80', firmwareVersion: '5.40', ipAddress: '192.168.1.101', port: 4370, status: 'online', branchId: '1', lastSeenAt: new Date().toISOString(), createdAt: '2024-01-10' },
  { id: '3', name: 'ZK-Face-002', serialNumber: 'ZK-003', model: 'Face ID 7', firmwareVersion: '6.60', ipAddress: '192.168.2.100', port: 4370, status: 'offline', branchId: '2', lastSeenAt: new Date(Date.now() - 86400000).toISOString(), createdAt: '2024-02-15' },
  { id: '4', name: 'ZK-Face-003', serialNumber: 'ZK-004', model: 'Face ID 7', firmwareVersion: '6.55', ipAddress: '192.168.3.100', port: 4370, status: 'error', branchId: '3', lastSeenAt: new Date(Date.now() - 7200000).toISOString(), createdAt: '2024-03-01' },
];

export default function DevicesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const { deviceStatus } = useRealtime();

  const filtered = mockData.map((d) => ({
    ...d,
    status: (deviceStatus[d.id] as Device['status']) || d.status,
  })).filter((d) => {
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) || d.serialNumber.includes(search);
    const matchesStatus = !statusFilter || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const onlineCount = filtered.filter((d) => d.status === 'online').length;

  const handleSync = async (deviceId: string) => {
    setSyncing(deviceId);
    await new Promise((r) => setTimeout(r, 1500));
    toast.success('Sincronización completada');
    setSyncing(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dispositivos</h2>
          <p className="text-sm text-gray-500">{onlineCount} de {filtered.length} en línea</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>+ Registrar Dispositivo</Button>
      </div>

      <Filters
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nombre o serie..."
        filters={[
          { key: 'status', label: 'Estados', options: [{ value: 'online', label: 'Online' }, { value: 'offline', label: 'Offline' }, { value: 'error', label: 'Error' }], value: statusFilter, onChange: setStatusFilter },
        ]}
      />

      <DataTable
        columns={[
          { key: 'name', header: 'Nombre', sortable: true },
          { key: 'serialNumber', header: 'Serie', sortable: true },
          { key: 'model', header: 'Modelo' },
          { key: 'ipAddress', header: 'IP' },
          {
            key: 'status',
            header: 'Estado',
            render: (d: Device) => (
              <div className="flex items-center gap-2">
                {d.status === 'online' ? <Wifi className="w-4 h-4 text-green-500" /> : <WifiOff className="w-4 h-4 text-gray-400" />}
                <Badge variant={d.status === 'online' ? 'success' : d.status === 'error' ? 'error' : 'default'}>
                  {d.status}
                </Badge>
              </div>
            ),
          },
          {
            key: 'lastSeenAt',
            header: 'Última Conexión',
            sortable: true,
            render: (d: Device) => d.lastSeenAt ? new Date(d.lastSeenAt).toLocaleString() : 'Nunca',
          },
          {
            key: 'actions',
            header: '',
            render: (d: Device) => (
              <Button
                size="sm"
                variant="ghost"
                loading={syncing === d.id}
                onClick={() => handleSync(d.id)}
              >
                <RefreshCw className={cn('w-4 h-4', syncing === d.id && 'animate-spin')} />
              </Button>
            ),
          },
        ]}
        data={filtered}
        keyExtractor={(d) => d.id}
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Registrar Dispositivo">
        <div className="space-y-4">
          <Input label="Nombre" placeholder="Ej: ZK-Face-SucursalCentro" />
          <Input label="Número de Serie" placeholder="ZK-XXX" />
          <Input label="Dirección IP" placeholder="192.168.1.100" />
          <Input label="Puerto" placeholder="4370" />
          <Input label="Modelo" placeholder="Face ID 7" />
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => { toast.success('Dispositivo registrado'); setDialogOpen(false); }}>Registrar</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
