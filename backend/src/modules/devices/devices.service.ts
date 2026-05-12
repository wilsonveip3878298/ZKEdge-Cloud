import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from './device.entity';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device)
    private readonly repo: Repository<Device>,
  ) {}

  async findAll(): Promise<Device[]> {
    return this.repo.find({ relations: ['branch'] });
  }

  async findOne(id: string): Promise<Device> {
    const device = await this.repo.findOne({ where: { id }, relations: ['branch'] });
    if (!device) throw new NotFoundException('Device not found');
    return device;
  }

  async findBySerial(serial: string): Promise<Device | null> {
    return this.repo.findOne({ where: { serialNumber: serial } });
  }

  async create(data: Partial<Device>): Promise<Device> {
    const device = this.repo.create(data);
    return this.repo.save(device);
  }

  async update(id: string, data: Partial<Device>): Promise<Device> {
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async sendCommand(id: string, command: any): Promise<any> {
    const device = await this.findOne(id);
    return { deviceId: device.id, command, status: 'queued' };
  }
}
