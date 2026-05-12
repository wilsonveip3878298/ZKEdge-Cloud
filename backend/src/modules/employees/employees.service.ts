import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from './employee.entity';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private readonly repo: Repository<Employee>,
  ) {}

  async findAll(branchId?: string): Promise<Employee[]> {
    const where: any = {};
    if (branchId) where.branchId = branchId;
    return this.repo.find({ where, relations: ['company', 'branch'] });
  }

  async findOne(id: string): Promise<Employee> {
    const employee = await this.repo.findOne({ where: { id }, relations: ['company', 'branch'] });
    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }

  async findByEmployeeId(employeeId: string): Promise<Employee | null> {
    return this.repo.findOne({ where: { employeeId } });
  }

  async create(data: Partial<Employee>): Promise<Employee> {
    const employee = this.repo.create(data);
    return this.repo.save(employee);
  }

  async update(id: string, data: Partial<Employee>): Promise<Employee> {
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
