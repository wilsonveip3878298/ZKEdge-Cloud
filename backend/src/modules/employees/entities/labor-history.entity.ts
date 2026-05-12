import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Employee } from '@modules/employees/employee.entity';

@Entity('labor_history')
export class LaborHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150 })
  company: string;

  @Column({ length: 100 })
  position: string;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  salary: number;

  @ManyToOne(() => Employee, (e) => e.laborHistory)
  @JoinColumn({ name: 'employeeId' })
  employee: Employee;

  @Column()
  employeeId: string;

  @CreateDateColumn()
  createdAt: Date;
}
