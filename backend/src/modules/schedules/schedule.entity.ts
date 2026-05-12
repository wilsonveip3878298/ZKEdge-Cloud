import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Company } from '@modules/companies/company.entity';

@Entity('schedules')
export class Schedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 5 })
  startTime: string;

  @Column({ length: 5 })
  endTime: string;

  @Column({ type: 'int', default: 0 })
  toleranceMinutes: number;

  @Column({ type: 'simple-json' })
  workDays: number[];

  @Column({ type: 'int', default: 0 })
  gracePeriodMinutes: number;

  @Column({ type: 'int', default: 0 })
  minHoursForOvertime: number;

  @Column({ type: 'int', default: 0 })
  maxRegularHours: number;

  @Column({ default: true })
  isActive: boolean;

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
