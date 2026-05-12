import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';

@ApiTags('Attendance')
@UseGuards(JwtAuthGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly service: AttendanceService) {}

  @Get()
  @ApiOperation({ summary: 'Get attendance records' })
  findAll(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('employeeId') employeeId?: string,
  ) {
    return this.service.findAll({ from, to, employeeId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get attendance record by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post('sync')
  @ApiOperation({ summary: 'Sync attendance from agent' })
  sync(@Body() records: any[]) {
    return this.service.syncRecords(records);
  }

  @Post('manual')
  @ApiOperation({ summary: 'Manual attendance entry' })
  createManual(@Body() data: any) {
    return this.service.create(data);
  }
}
