'use client';

import { useState } from 'react';
import { TrendingUp, Users, Clock, AlertTriangle, BarChart3, Target } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AttendanceTrend } from '@/components/charts/attendance-trend';

const kpiData = [
  { label: 'Puntualidad', value: '91.5%', change: '+2.3%', positive: true },
  { label: 'Ausentismo', value: '4.2%', change: '-0.8%', positive: true },
  { label: 'Rotación', value: '2.1%', change: '+0.3%', positive: false },
  { label: 'Productividad', value: '87.5', change: '+5.2%', positive: true },
];

const trendData = Array.from({ length: 12 }, (_, i) => ({
  date: new Date(2026, i).toLocaleString('es', { month: 'short' }),
  count: Math.floor(Math.random() * 30) + 70,
}));

const heatmapDays = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  attendance: Math.floor(Math.random() * 40) + 60,
}));

export default function HRAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Analytics RRHH</h2>
        <p className="text-sm text-gray-500">KPIs y métricas de capital humano</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {kpiData.map((kpi) => (
          <Card key={kpi.label} title={kpi.label} value={kpi.value} description={
            <span className={kpi.positive ? 'text-green-500' : 'text-red-500'}>{kpi.change}</span>
          } />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Asistencia Mensual</h3>
          <AttendanceTrend data={trendData} />
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Heatmap de Marcaciones</h3>
          <div className="grid grid-cols-10 gap-1">
            {heatmapDays.map((d) => (
              <div key={d.day} className="group relative">
                <div
                  className="h-6 rounded cursor-pointer"
                  style={{ backgroundColor: `hsl(${120 - d.attendance * 1.2}, 70%, ${40 + d.attendance * 0.2}%)` }}
                  title={`Día ${d.day}: ${d.attendance}%`}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>Baja asistencia</span>
            <span>Alta asistencia</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Target className="w-8 h-8 text-primary-500" />
            <div>
              <p className="text-sm text-gray-500">Depto. más puntual</p>
              <p className="font-semibold">TI - 96%</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
            <div>
              <p className="text-sm text-gray-500">Mayor ausentismo</p>
              <p className="font-semibold">Ventas - 8.3%</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-sm text-gray-500">Horas extra totales</p>
              <p className="font-semibold">156 hrs este mes</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
