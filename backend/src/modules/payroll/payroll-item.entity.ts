import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Payroll } from './payroll.entity';
import { Employee } from '@modules/employees/employee.entity';

@Entity('payroll_items')
export class PayrollItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Payroll)
  @JoinColumn({ name: 'payrollId' })
  payroll: Payroll;

  @Column()
  payrollId: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employeeId' })
  employee: Employee;

  @Column()
  employeeId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  baseSalary: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  overtimePay: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  bonuses: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  commissions: number;

  @Column({ type: 'int', default: 0 })
  lateMinutes: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  lateDeduction: number;

  @Column({ type: 'int', default: 0 })
  absences: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  absenceDeduction: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  taxDeduction: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  socialSecurity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  healthInsurance: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  advances: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  otherDeductions: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  netPay: number;

  @Column({ type: 'jsonb', nullable: true })
  details: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
