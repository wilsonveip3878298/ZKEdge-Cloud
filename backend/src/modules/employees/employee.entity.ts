import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Company } from '@modules/companies/company.entity';
import { Branch } from '@modules/branches/branch.entity';
import { AttendanceRecord } from '@modules/attendance/attendance.entity';
import { Contract } from './entities/contract.entity';
import { EmployeeDocument } from './entities/document.entity';
import { LaborHistory } from './entities/labor-history.entity';

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, unique: true })
  employeeId: string;

  @Column({ length: 100 })
  firstName: string;

  @Column({ length: 100 })
  lastName: string;

  @Column({ length: 20, unique: true, nullable: true })
  cardNumber: string;

  @Column({ length: 150, nullable: true })
  email: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ length: 50, nullable: true })
  department: string;

  @Column({ length: 50, nullable: true })
  position: string;

  @Column({ length: 20, nullable: true })
  documentType: string;

  @Column({ length: 30, nullable: true })
  documentNumber: string;

  @Column({ type: 'date', nullable: true })
  birthDate: Date;

  @Column({ length: 10, nullable: true })
  gender: string;

  @Column({ length: 200, nullable: true })
  address: string;

  @Column({ type: 'date', nullable: true })
  hireDate: Date;

  @Column({ length: 50, nullable: true })
  costCenter: string;

  @Column({ length: 50, nullable: true })
  supervisorId: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ length: 200, nullable: true })
  photoUrl: string;

  @ManyToOne(() => Company, (c) => c.employees, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column()
  companyId: string;

  @ManyToOne(() => Branch, (b) => b.employees, { nullable: true })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Column({ nullable: true })
  branchId: string;

  @OneToMany(() => AttendanceRecord, (a) => a.employee)
  attendanceRecords: AttendanceRecord[];

  @OneToMany(() => Contract, (c) => c.employee)
  contracts: Contract[];

  @OneToMany(() => EmployeeDocument, (d) => d.employee)
  documents: EmployeeDocument[];

  @OneToMany(() => LaborHistory, (h) => h.employee)
  laborHistory: LaborHistory[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
