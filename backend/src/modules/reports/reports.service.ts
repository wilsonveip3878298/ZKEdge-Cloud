import { Injectable } from '@nestjs/common';

@Injectable()
export class ReportsService {
  async attendanceSummary(from: string, to: string, companyId?: string): Promise<any> {
    return {
      from,
      to,
      companyId,
      totalRecords: 0,
      uniqueEmployees: 0,
      averageHours: 0,
    };
  }

  async deviceStatus(companyId?: string): Promise<any> {
    return {
      total: 0,
      online: 0,
      offline: 0,
      error: 0,
    };
  }

  async currentlyPresent(branchId?: string): Promise<any> {
    return { count: 0, employees: [] };
  }
}
