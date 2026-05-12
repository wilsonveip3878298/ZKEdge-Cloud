import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branch } from './branch.entity';

@Injectable()
export class BranchesService {
  constructor(
    @InjectRepository(Branch)
    private readonly repo: Repository<Branch>,
  ) {}

  async findAll(): Promise<Branch[]> {
    return this.repo.find({ relations: ['company', 'devices'] });
  }

  async findOne(id: string): Promise<Branch> {
    const branch = await this.repo.findOne({ where: { id }, relations: ['company', 'devices'] });
    if (!branch) throw new NotFoundException('Branch not found');
    return branch;
  }

  async create(data: Partial<Branch>): Promise<Branch> {
    const branch = this.repo.create(data);
    return this.repo.save(branch);
  }

  async update(id: string, data: Partial<Branch>): Promise<Branch> {
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
