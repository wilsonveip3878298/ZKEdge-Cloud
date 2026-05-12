import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DevicesService } from './devices.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';

@ApiTags('Devices')
@UseGuards(JwtAuthGuard)
@Controller('devices')
export class DevicesController {
  constructor(private readonly service: DevicesService) {}

  @Get()
  @ApiOperation({ summary: 'List all devices' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get device by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Register new device' })
  create(@Body() data: any) {
    return this.service.create(data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update device' })
  update(@Param('id') id: string, @Body() data: any) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove device' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post(':id/command')
  @ApiOperation({ summary: 'Send command to device' })
  sendCommand(@Param('id') id: string, @Body() command: any) {
    return this.service.sendCommand(id, command);
  }
}
