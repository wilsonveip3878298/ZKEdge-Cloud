import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HRRequest, RequestType, RequestStatus } from './request.entity';

@Injectable()
export class WorkflowService {
  constructor(@InjectRepository(HRRequest) private repo: Repository<HRRequest>) {}

  async list(companyId: string, status?: string) {
    const where: any = { companyId };
    if (status) where.status = status;
    return this.repo.find({ where, order: { createdAt: 'DESC' }, relations: ['employee'] });
  }

  async create(data: Partial<HRRequest>) {
    const days = Math.ceil((new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) / 86400000) + 1;
    return this.repo.save(this.repo.create({ ...data, daysCount: days }));
  }

  async approve(id: string, approvedById: string) {
    await this.repo.update(id, { status: RequestStatus.APPROVED, approvedById });
    return { status: 'approved' };
  }

  async reject(id: string, reason: string) {
    await this.repo.update(id, { status: RequestStatus.REJECTED, rejectionReason: reason });
    return { status: 'rejected' };
  }
}
