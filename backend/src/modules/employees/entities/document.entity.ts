import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Employee } from '@modules/employees/employee.entity';

@Entity('employee_documents')
export class EmployeeDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 50 })
  type: string;

  @Column({ length: 500 })
  url: string;

  @Column({ type: 'int', nullable: true })
  fileSize: number;

  @Column({ type: 'date', nullable: true })
  expiryDate: Date;

  @ManyToOne(() => Employee, (e) => e.documents)
  @JoinColumn({ name: 'employeeId' })
  employee: Employee;

  @Column()
  employeeId: string;

  @CreateDateColumn()
  createdAt: Date;
}
