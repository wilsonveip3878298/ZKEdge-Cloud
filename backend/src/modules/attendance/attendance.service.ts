import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AttendanceRecord } from './attendance.entity';

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);
  private readonly recentUuids = new Set<string>();

  constructor(
    @InjectRepository(AttendanceRecord)
    private readonly repo: Repository<AttendanceRecord>,
  ) {
    setInterval(() => this.recentUuids.clear(), 60000);
  }

  async findAll(filters: { from?: string; to?: string; employeeId?: string }): Promise<AttendanceRecord[]> {
    const where: any = {};

    if (filters.from && filters.to) {
      where.timestamp = Between(new Date(filters.from), new Date(filters.to));
    }

    if (filters.employeeId) {
      where.employeeId = filters.employeeId;
    }

    return this.repo.find({
      where,
      relations: ['device', 'employee'],
      order: { timestamp: 'DESC' },
      take: 1000,
    });
  }

  async findOne(id: string): Promise<AttendanceRecord | null> {
    return this.repo.findOne({ where: { id }, relations: ['device', 'employee'] });
  }

  async syncRecords(records: { uuid?: string; user_id: string; device_id: string; timestamp: string }[]): Promise<any> {
    let synced = 0;
    let duplicates = 0;

    for (const r of records) {
      if (r.uuid && this.recentUuids.has(r.uuid)) {
        duplicates++;
        continue;
      }

      if (r.uuid) {
        this.recentUuids.add(r.uuid);
      }

      const record = this.repo.create({
        employeeId: r.user_id,
        companyId: '1',
        deviceId: r.device_id,
        timestamp: new Date(r.timestamp),
        isSynced: true,
        rawData: r,
      });

      try {
        await this.repo.save(record);
        synced++;
      } catch (err: any) {
        if (err.code === '23505') {
          duplicates++;
          continue;
        }
        this.logger.error(`Failed to save record: ${err.message}`);
      }
    }

    this.logger.log(`Sync complete: ${synced} synced, ${duplicates} duplicates`);
    return { synced, duplicates, total: records.length };
  }

  async create(data: Partial<AttendanceRecord>): Promise<AttendanceRecord> {
    const record = this.repo.create(data);
    return this.repo.save(record);
  }
}
