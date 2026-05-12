import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  async processAttendance(records: any[]): Promise<any> {
    this.logger.log(`Processing ${records.length} attendance records`);
    return { received: records.length, status: 'processed' };
  }

  async processUsers(users: any[]): Promise<any> {
    this.logger.log(`Processing ${users.length} user records`);
    return { received: users.length, status: 'processed' };
  }

  async processStatus(status: any): Promise<any> {
    this.logger.log(`Agent status: ${JSON.stringify(status)}`);
    return { status: 'acknowledged' };
  }
}
