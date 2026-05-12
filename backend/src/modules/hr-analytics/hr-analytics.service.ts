import { Injectable } from '@nestjs/common';

@Injectable()
export class HRAnalyticsService {
  async getKPIs(companyId: string) {
    return {
      totalEmployees: 245,
      activeEmployees: 230,
      presentToday: 198,
      absenceRate: '4.2%',
      lateRate: '8.5%',
      overtimeHours: 156,
      avgHoursPerDay: 8.2,
      turnoverRate: '2.1%',
      productivityScore: 87.5,
      topDepartments: [
        { name: 'TI', punctuality: 96 },
        { name: 'RRHH', punctuality: 94 },
        { name: 'Ventas', punctuality: 88 },
      ],
    };
  }

  async getAttendanceHeatmap(companyId: string, from: string, to: string) {
    const days = [];
    const start = new Date(from);
    const end = new Date(to);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push({ date: d.toISOString().split('T')[0], attendance: Math.floor(Math.random() * 50) + 50 });
    }
    return { companyId, from, to, data: days };
  }

  async getDelayTrend(companyId: string) {
    return Array.from({ length: 12 }, (_, i) => ({
      month: new Date(2026, i).toLocaleString('es', { month: 'short' }),
      delays: Math.floor(Math.random() * 30) + 10,
      absences: Math.floor(Math.random() * 10) + 2,
    }));
  }
}
