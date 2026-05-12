import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Device } from '@modules/devices/device.entity';
import { Employee } from '@modules/employees/employee.entity';

export enum AttendanceType {
  CHECK_IN = 'check_in',
  CHECK_OUT = 'check_out',
  OVERTIME_IN = 'overtime_in',
  OVERTIME_OUT = 'overtime_out',
}

@Entity('attendance_records')
@Index(['employeeId', 'timestamp'])
@Index(['deviceId', 'timestamp'])
@Index(['companyId', 'timestamp'])
export class AttendanceRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  employeeId: string;

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @Column({
    type: 'enum',
    enum: AttendanceType,
    default: AttendanceType.CHECK_IN,
  })
  type: AttendanceType;

  @Column({ default: false })
  isSynced: boolean;

  @Column({ type: 'jsonb', nullable: true })
  rawData: Record<string, any>;

  @ManyToOne(() => Device, (d) => d.attendanceRecords)
  @JoinColumn({ name: 'deviceId' })
  device: Device;

  @Column()
  deviceId: string;

  @ManyToOne(() => Employee, (e) => e.attendanceRecords)
  @JoinColumn({ name: 'employeeRecordId' })
  employee: Employee;

  @Column()
  employeeRecordId: string;

  @Column()
  companyId: string;

  @CreateDateColumn()
  createdAt: Date;
}
