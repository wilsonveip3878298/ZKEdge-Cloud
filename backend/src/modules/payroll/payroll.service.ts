import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payroll, PayrollStatus } from './payroll.entity';
import { PayrollItem } from './payroll-item.entity';

@Injectable()
export class PayrollService {
  private readonly logger = new Logger(PayrollService.name);

  constructor(
    @InjectRepository(Payroll) private payrollRepo: Repository<Payroll>,
    @InjectRepository(PayrollItem) private itemRepo: Repository<PayrollItem>,
  ) {}

  async list(companyId: string) {
    return this.payrollRepo.find({ where: { companyId }, order: { year: 'DESC', month: 'DESC' } });
  }

  async generate(companyId: string, period: string, year: number, month: number) {
    const existing = await this.payrollRepo.findOne({ where: { companyId, period, year, month } });
    if (existing) return { status: 'exists', payrollId: existing.id };

    const payroll = await this.payrollRepo.save(this.payrollRepo.create({ companyId, period, year, month, status: PayrollStatus.DRAFT }));
    this.logger.log(`Payroll generated: ${companyId}/${period}/${year}/${month}`);
    return { status: 'created', payrollId: payroll.id };
  }

  async approve(id: string) {
    await this.payrollRepo.update(id, { status: PayrollStatus.APPROVED });
    return { status: 'approved' };
  }

  async getItems(payrollId: string) {
    return this.itemRepo.find({ where: { payrollId }, relations: ['employee'] });
  }

  async exportCsv(payrollId: string) {
    const items = await this.getItems(payrollId);
    const header = 'employee,base_salary,overtime,bonuses,deductions,net_pay';
    const rows = items.map((i) => `${i.employeeId},${i.baseSalary},${i.overtimePay},${i.bonuses},${i.lateDeduction + i.absenceDeduction + i.taxDeduction},${i.netPay}`);
    return [header, ...rows].join('\n');
  }
}
