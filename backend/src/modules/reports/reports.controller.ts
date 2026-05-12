import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';

@ApiTags('Reports')
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('attendance/summary')
  @ApiOperation({ summary: 'Attendance summary report' })
  attendanceSummary(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('companyId') companyId?: string,
  ) {
    return this.service.attendanceSummary(from, to, companyId);
  }

  @Get('devices/status')
  @ApiOperation({ summary: 'Device status report' })
  deviceStatus(@Query('companyId') companyId?: string) {
    return this.service.deviceStatus(companyId);
  }

  @Get('employees/present')
  @ApiOperation({ summary: 'Currently present employees' })
  currentlyPresent(@Query('branchId') branchId?: string) {
    return this.service.currentlyPresent(branchId);
  }
}
