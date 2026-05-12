import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Company } from '@modules/companies/company.entity';

export enum PayrollStatus { DRAFT = 'draft', APPROVED = 'approved', PAID = 'paid', CANCELLED = 'cancelled' }

@Entity('payrolls')
export class Payroll {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 10 })
  period: string;

  @Column({ type: 'int' })
  year: number;

  @Column({ type: 'int' })
  month: number;

  @Column({ type: 'enum', enum: PayrollStatus, default: PayrollStatus.DRAFT })
  status: PayrollStatus;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  totalSalaries: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  totalDeductions: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  totalBonuses: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  totalOvertime: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  totalNetPay: number;

  @Column({ type: 'int', default: 0 })
  employeeCount: number;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column()
  companyId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
