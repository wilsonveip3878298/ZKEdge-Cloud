'use client';

import { useState } from 'react';
import { DollarSign, FileText, CheckCircle, Download } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/data-tables/data-table';
import { toast } from 'sonner';

interface PayrollPeriod {
  id: string; period: string; year: number; month: number; status: string;
  totalSalaries: number; totalDeductions: number; totalNetPay: number; employeeCount: number;
}

const mockPayrolls: PayrollPeriod[] = [
  { id: '1', period: '2026-05', year: 2026, month: 5, status: 'draft', totalSalaries: 85000, totalDeductions: 12500, totalNetPay: 72500, employeeCount: 24 },
  { id: '2', period: '2026-04', year: 2026, month: 4, status: 'paid', totalSalaries: 82000, totalDeductions: 11800, totalNetPay: 70200, employeeCount: 24 },
  { id: '3', period: '2026-03', year: 2026, month: 3, status: 'paid', totalSalaries: 81000, totalDeductions: 11500, totalNetPay: 69500, employeeCount: 23 },
];

export default function PayrollPage() {
  const [payrolls] = useState(mockPayrolls);

  const totalPayroll = payrolls.filter(p => p.status === 'paid').reduce((s, p) => s + p.totalNetPay, 0);

  const handleGenerate = () => {
    toast.success('Planilla generada correctamente');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">Planillas</h2><p className="text-sm text-gray-500">Gestión de payroll</p></div>
        <Button onClick={handleGenerate}>+ Generar Planilla</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card title="Total Planillas" value={`$${totalPayroll.toLocaleString()}`} icon={<DollarSign className="w-6 h-6" />} />
        <Card title="Este Período" value="$72,500" icon={<FileText className="w-6 h-6" />} description="Mayo 2026" />
        <Card title="Empleados" value="24" icon={<DollarSign className="w-6 h-6" />} description="En nómina" />
        <Card title="Deducciones" value="$12,500" icon={<DollarSign className="w-6 h-6" />} description="Este período" />
      </div>

      <DataTable
        columns={[
          { key: 'period', header: 'Período', sortable: true },
          { key: 'employeeCount', header: 'Empleados' },
          { key: 'totalSalaries', header: 'Salarios', render: (p: PayrollPeriod) => `$${p.totalSalaries.toLocaleString()}` },
          { key: 'totalDeductions', header: 'Deducciones', render: (p: PayrollPeriod) => `-$${p.totalDeductions.toLocaleString()}` },
          { key: 'totalNetPay', header: 'Neto', render: (p: PayrollPeriod) => <span className="font-semibold">${p.totalNetPay.toLocaleString()}</span> },
          { key: 'status', header: 'Estado', render: (p: PayrollPeriod) => <Badge variant={p.status === 'paid' ? 'success' : p.status === 'approved' ? 'info' : 'warning'}>{p.status}</Badge> },
        ]}
        data={payrolls}
        keyExtractor={(p) => p.id}
      />
    </div>
  );
}
