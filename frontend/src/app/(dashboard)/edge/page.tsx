'use client';

import { useState } from 'react';
import { Activity, Server, Wifi, WifiOff, AlertTriangle, HardDrive, Database, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-tables/data-table';
import { cn } from '@/lib/utils';

interface EdgeNode {
  id: string;
  name: string;
  branch: string;
  version: string;
  state: 'online' | 'offline' | 'degraded';
  lastHeartbeat: string;
  stats: {
    uptimeSeconds: number;
    queueSize: number;
    deadLetterCount: number;
    recordsStored: number;
    syncAttempts: number;
    syncFailures: number;
    memoryUsageMB: number;
    devicesFound: number;
  };
}

const mockNodes: EdgeNode[] = [
  { id: 'AGENT-001', name: 'Edge Centro', branch: 'Sucursal Centro', version: '1.0.0', state: 'online', lastHeartbeat: new Date().toISOString(), stats: { uptimeSeconds: 86400, queueSize: 0, deadLetterCount: 0, recordsStored: 0, syncAttempts: 1452, syncFailures: 3, memoryUsageMB: 28.5, devicesFound: 3 } },
  { id: 'AGENT-002', name: 'Edge Norte', branch: 'Sucursal Norte', version: '1.0.0', state: 'online', lastHeartbeat: new Date(Date.now() - 15000).toISOString(), stats: { uptimeSeconds: 43200, queueSize: 0, deadLetterCount: 0, recordsStored: 0, syncAttempts: 823, syncFailures: 1, memoryUsageMB: 24.2, devicesFound: 2 } },
  { id: 'AGENT-003', name: 'Edge Sur', branch: 'Sucursal Sur', version: '0.9.0', state: 'degraded', lastHeartbeat: new Date(Date.now() - 120000).toISOString(), stats: { uptimeSeconds: 7200, queueSize: 15, deadLetterCount: 3, recordsStored: 45, syncAttempts: 120, syncFailures: 12, memoryUsageMB: 32.1, devicesFound: 1 } },
  { id: 'AGENT-004', name: 'Edge Este', branch: 'Sucursal Este', version: '1.0.0', state: 'offline', lastHeartbeat: new Date(Date.now() - 3600000).toISOString(), stats: { uptimeSeconds: 0, queueSize: 0, deadLetterCount: 0, recordsStored: 23, syncAttempts: 0, syncFailures: 0, memoryUsageMB: 0, devicesFound: 0 } },
];

const formatUptime = (seconds: number): string => {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h`;
  return `${Math.floor(seconds / 60)}m`;
};

export default function EdgePage() {
  const [nodes] = useState(mockNodes);

  const onlineCount = nodes.filter((n) => n.state === 'online').length;
  const totalDeadLetters = nodes.reduce((s, n) => s + n.stats.deadLetterCount, 0);
  const totalQueueSize = nodes.reduce((s, n) => s + n.stats.queueSize, 0);
  const totalDevices = nodes.reduce((s, n) => s + n.stats.devicesFound, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Edge Computing</h2>
          <p className="text-sm text-gray-500">Monitoreo de nodos edge distribuidos</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          <RefreshCw className="w-4 h-4 mr-1" /> Actualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card title="Nodos Edge" value={nodes.length} icon={<Server className="w-6 h-6" />} description={`${onlineCount} en línea`} />
        <Card title="Dispositivos" value={totalDevices} icon={<HardDrive className="w-6 h-6" />} description="Conectados a edge" />
        <Card title="Cola Offline" value={totalQueueSize} icon={<Database className="w-6 h-6" />} description="Pendientes de sync" />
        <Card title="Dead Letters" value={totalDeadLetters} icon={<AlertTriangle className="w-6 h-6 text-red-500" />} description="Requieren atención" />
        <Card title="Tasa de Sync" value="98.7%" icon={<Activity className="w-6 h-6 text-green-500" />} description="Última hora" />
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Nodos Edge</h3>
        <DataTable
          columns={[
            { key: 'name', header: 'Nombre', sortable: true },
            { key: 'branch', header: 'Sucursal', sortable: true },
            { key: 'version', header: 'Versión' },
            {
              key: 'state',
              header: 'Estado',
              render: (n: EdgeNode) => (
                <div className="flex items-center gap-2">
                  {n.state === 'online' ? <Wifi className="w-4 h-4 text-green-500" /> : n.state === 'degraded' ? <AlertTriangle className="w-4 h-4 text-yellow-500" /> : <WifiOff className="w-4 h-4 text-gray-400" />}
                  <Badge variant={n.state === 'online' ? 'success' : n.state === 'degraded' ? 'warning' : 'default'}>{n.state}</Badge>
                </div>
              ),
            },
            {
              key: 'lastHeartbeat',
              header: 'Último Heartbeat',
              sortable: true,
              render: (n: EdgeNode) => {
                const diff = Date.now() - new Date(n.lastHeartbeat).getTime();
                return (
                  <span className={cn(diff > 60000 ? 'text-red-500' : diff > 30000 ? 'text-yellow-500' : 'text-green-500')}>
                    {Math.floor(diff / 1000)}s atrás
                  </span>
                );
              },
            },
            {
              key: 'uptime',
              header: 'Uptime',
              render: (n: EdgeNode) => formatUptime(n.stats.uptimeSeconds),
            },
            { key: 'queueSize', header: 'Cola', render: (n: EdgeNode) => n.stats.queueSize },
            { key: 'deadLetters', header: 'DLQ', render: (n: EdgeNode) => <span className={n.stats.deadLetterCount > 0 ? 'text-red-500 font-medium' : ''}>{n.stats.deadLetterCount}</span> },
          ]}
          data={nodes}
          keyExtractor={(n) => n.id}
        />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-3">Arquitectura Edge</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <p><strong className="text-gray-900">Cada sucursal es un nodo edge autónomo</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Comunicación TCP/IP con biométricos ZKTeco</li>
              <li>Procesamiento local de eventos</li>
              <li>Cola offline persistente (SQLite)</li>
              <li>Dead Letter Queue para errores</li>
              <li>Circuit Breaker para tolerancia a fallos</li>
              <li>Sincronización eventual con Cloud</li>
            </ul>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-3">Nodo Seleccionado</h3>
          {nodes.filter((n) => n.state === 'online')[0] ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Nodo:</span><span className="font-medium">Edge Centro</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Memoria:</span><span>28.5 MB</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Uptime:</span><span>1d 0h</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Sync Intentos:</span><span>1,452</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Fallos:</span><span className="text-yellow-500">3</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Dispositivos:</span><span>3</span></div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Selecciona un nodo para ver detalles</p>
          )}
        </Card>
      </div>
    </div>
  );
}
