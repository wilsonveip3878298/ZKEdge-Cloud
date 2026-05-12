import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Schedule } from './schedule.entity';
import { Holiday } from './holiday.entity';

@Injectable()
export class SchedulesService {
  constructor(
    @InjectRepository(Schedule) private schedules: Repository<Schedule>,
    @InjectRepository(Holiday) private holidays: Repository<Holiday>,
  ) {}

  async findAll(companyId: string) { return this.schedules.find({ where: { companyId } }); }

  async findOne(id: string) { return this.schedules.findOne({ where: { id } }); }

  async create(data: Partial<Schedule>) { return this.schedules.save(this.schedules.create(data)); }

  async getHolidays(companyId: string, year: number) {
    return this.holidays.find({ where: { companyId, year } });
  }

  async addHoliday(data: Partial<Holiday>) { return this.holidays.save(this.holidays.create(data)); }

  async calculateWorkedHours(employeeId: string, date: Date, checkIn: string, checkOut: string) {
    const dayOfWeek = date.getDay();
    const schedule = await this.schedules.findOne({ where: { isActive: true } });
    if (!schedule || !schedule.workDays.includes(dayOfWeek)) return { type: 'day_off', hours: 0 };

    const inMinutes = this.timeToMinutes(checkIn);
    const outMinutes = this.timeToMinutes(checkOut);
    const expectedIn = this.timeToMinutes(schedule.startTime);
    const expectedOut = this.timeToMinutes(schedule.endTime);
    const totalMinutes = outMinutes - inMinutes;
    const expectedMinutes = expectedOut - expectedIn;
    const delay = Math.max(0, inMinutes - expectedIn - schedule.toleranceMinutes);
    const overtime = Math.max(0, totalMinutes - expectedMinutes - schedule.minHoursForOvertime * 60);

    return { type: 'worked', hours: totalMinutes / 60, delay, overtime, expectedHours: expectedMinutes / 60 };
  }

  private timeToMinutes(t: string): number {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  }
}
