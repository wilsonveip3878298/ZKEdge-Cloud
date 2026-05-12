'use client';

import { useState, useEffect } from 'react';
import { Users, Monitor, Clock, Building2, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CardSkeleton } from '@/components/ui/skeleton';
import { DeviceStatusChart } from '@/components/charts/device-status';
import { AttendanceTrend } from '@/components/charts/attendance-trend';
import { useRealtime } from '@/hooks/use-realtime';

const deviceData = [
  { name: 'Online', value: 12, color: '#22c55e' },
  { name: 'Offline', value: 3, color: '#6b7280' },
  { name: 'Error', value: 1, color: '#ef4444' },
];

const trendData = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 86400000).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }),
  count: Math.floor(Math.random() * 60) + 20,
}));

const recentEvents = [
  { id: '1', type: 'Marcación', employee: 'Juan Pérez', time: '08:02', status: 'success' },
  { id: '2', type: 'Marcación', employee: 'María García', time: '07:55', status: 'success' },
  { id: '3', type: 'Alerta', employee: 'Dispositivo ZK-003', time: '07:30', status: 'warning' },
  { id: '4', type: 'Marcación', employee: 'Carlos López', time: '07:45', status: 'success' },
];

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const { connected } = useRealtime();

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="text-sm text-gray-500">Monitoreo centralizado del sistema</p>
        </div>
        <Badge variant={connected ? 'success' : 'warning'}>
          {connected ? 'Conectado' : 'Reconectando...'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="Empleados" value="245" icon={<Users className="w-6 h-6" />} description="128 presentes hoy" />
        <Card title="Dispositivos" value="16" icon={<Monitor className="w-6 h-6" />} description="12 en línea, 3 offline" />
        <Card title="Marcaciones Hoy" value="156" icon={<Clock className="w-6 h-6" />} description="Última hace 2 min" />
        <Card title="Sucursales" value="5" icon={<Building2 className="w-6 h-6" />} description="4 activas ahora" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="Retrasos Hoy" value="8" icon={<AlertTriangle className="w-6 h-6 text-yellow-500" />} description="3 mayores a 15 min" />
        <Card title="Horas Extras" value="12" icon={<TrendingUp className="w-6 h-6 text-blue-500" />} description="Acumulado semanal" />
        <Card title="Eficiencia" value="94%" icon={<TrendingUp className="w-6 h-6 text-green-500" />} description="+2% vs ayer" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Tendencia de Marcaciones (30 días)</h3>
            <AttendanceTrend data={trendData} />
          </Card>
        </div>
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Estado de Dispositivos</h3>
          <DeviceStatusChart data={deviceData} />
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Eventos Recientes</h3>
        <div className="space-y-2">
          {recentEvents.map((ev) => (
            <div key={ev.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className={`w-2 h-2 rounded-full ${ev.status === 'success' ? 'bg-green-500' : 'bg-yellow-500'}`} />
              <div className="flex-1">
                <p className="text-sm font-medium">{ev.employee}</p>
                <p className="text-xs text-gray-500">{ev.type}</p>
              </div>
              <span className="text-sm text-gray-400">{ev.time}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
