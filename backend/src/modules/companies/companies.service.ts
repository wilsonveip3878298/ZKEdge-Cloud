import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './company.entity';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private readonly repo: Repository<Company>,
  ) {}

  async findAll(): Promise<Company[]> {
    return this.repo.find({ relations: ['branches'] });
  }

  async findOne(id: string): Promise<Company> {
    const company = await this.repo.findOne({ where: { id }, relations: ['branches'] });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async create(data: Partial<Company>): Promise<Company> {
    const company = this.repo.create(data);
    return this.repo.save(company);
  }

  async update(id: string, data: Partial<Company>): Promise<Company> {
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
