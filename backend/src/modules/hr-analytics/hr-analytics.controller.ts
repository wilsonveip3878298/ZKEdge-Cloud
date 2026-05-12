import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HRAnalyticsService } from './hr-analytics.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';

@ApiTags('HR Analytics')
@UseGuards(JwtAuthGuard)
@Controller('hr-analytics')
export class HRAnalyticsController {
  constructor(private readonly service: HRAnalyticsService) {}

  @Get('kpis')
  @ApiOperation({ summary: 'HR KPIs dashboard' })
  getKPIs(@CurrentUser('companyId') companyId: string) { return this.service.getKPIs(companyId); }

  @Get('heatmap')
  @ApiOperation({ summary: 'Attendance heatmap' })
  getHeatmap(@CurrentUser('companyId') companyId: string, @Query('from') from: string, @Query('to') to: string) {
    return this.service.getAttendanceHeatmap(companyId, from, to);
  }

  @Get('delay-trend')
  @ApiOperation({ summary: 'Delay/absence trend' })
  getDelayTrend(@CurrentUser('companyId') companyId: string) { return this.service.getDelayTrend(companyId); }
}
