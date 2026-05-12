'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { DataTable } from '@/components/data-tables/data-table';
import { AttendanceTrend } from '@/components/charts/attendance-trend';
import { toast } from 'sonner';

const trendData = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 86400000).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }),
  count: Math.floor(Math.random() * 60) + 20,
}));

const summaryData = [
  { employee: 'Juan Pérez', department: 'TI', entries: 22, delays: 2, hours: '176', overtime: '4' },
  { employee: 'María García', department: 'RRHH', entries: 20, delays: 0, hours: '160', overtime: '0' },
  { employee: 'Carlos López', department: 'TI', entries: 21, delays: 1, hours: '168', overtime: '2' },
];

export default function ReportsPage() {
  const [reportType, setReportType] = useState('attendance');

  const handleExport = (format: string) => {
    toast.success(`Reporte exportado en ${format.toUpperCase()}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Reportes</h2>
          <p className="text-sm text-gray-500">Análisis y exportación de datos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>
            <FileSpreadsheet className="w-4 h-4 mr-1" /> Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
            <FileText className="w-4 h-4 mr-1" /> PDF
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Filtros de Reporte</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            label="Tipo"
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            options={[
              { value: 'attendance', label: 'Asistencia' },
              { value: 'delays', label: 'Retrasos' },
              { value: 'overtime', label: 'Horas Extras' },
              { value: 'device', label: 'Dispositivos' },
            ]}
          />
          <Input label="Desde" type="date" />
          <Input label="Hasta" type="date" />
          <Select
            label="Sucursal"
            options={[
              { value: '', label: 'Todas' },
              { value: '1', label: 'Centro' },
              { value: '2', label: 'Norte' },
            ]}
          />
        </div>
        <div className="flex justify-end mt-4">
          <Button size="sm"><Filter className="w-4 h-4 mr-1" /> Aplicar Filtros</Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Tendencia de Asistencia</h3>
        <AttendanceTrend data={trendData} />
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Resumen del Período</h3>
          <Button variant="ghost" size="sm" onClick={() => handleExport('excel')}>
            <Download className="w-4 h-4 mr-1" /> Exportar
          </Button>
        </div>
        <DataTable
          columns={[
            { key: 'employee', header: 'Empleado', sortable: true },
            { key: 'department', header: 'Departamento', sortable: true },
            { key: 'entries', header: 'Entradas', sortable: true },
            { key: 'delays', header: 'Retrasos', sortable: true },
            { key: 'hours', header: 'Horas', sortable: true },
            { key: 'overtime', header: 'Extras', sortable: true },
          ]}
          data={summaryData}
          keyExtractor={(_, i) => String(i)}
          pageSize={10}
        />
      </Card>
    </div>
  );
}
