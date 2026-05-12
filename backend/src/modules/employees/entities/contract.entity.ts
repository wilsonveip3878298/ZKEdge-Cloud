import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Employee } from '@modules/employees/employee.entity';

export enum ContractType {
  INDEFINITE = 'indefinite',
  FIXED_TERM = 'fixed_term',
  PART_TIME = 'part_time',
  TEMPORARY = 'temporary',
  FREELANCE = 'freelance',
  INTERNSHIP = 'internship',
}

@Entity('contracts')
export class Contract {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ContractType })
  type: ContractType;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @Column({ length: 100 })
  position: string;

  @Column({ length: 100, nullable: true })
  department: string;

  @Column({ length: 100, nullable: true })
  costCenter: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  salary: number;

  @Column({ length: 3 })
  currency: string;

  @Column({ type: 'int', default: 30 })
  weeklyHours: number;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => Employee, (e) => e.contracts)
  @JoinColumn({ name: 'employeeId' })
  employee: Employee;

  @Column()
  employeeId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
