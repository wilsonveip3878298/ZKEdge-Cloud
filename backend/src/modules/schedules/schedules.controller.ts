import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SchedulesService } from './schedules.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';

@ApiTags('Schedules')
@UseGuards(JwtAuthGuard)
@Controller('schedules')
export class SchedulesController {
  constructor(private readonly service: SchedulesService) {}

  @Get()
  @ApiOperation({ summary: 'List schedules' })
  findAll(@CurrentUser('companyId') companyId: string) { return this.service.findAll(companyId); }

  @Post()
  @ApiOperation({ summary: 'Create schedule' })
  create(@Body() data: any) { return this.service.create(data); }

  @Get('holidays')
  @ApiOperation({ summary: 'Get holidays' })
  getHolidays(@CurrentUser('companyId') companyId: string, @Query('year') year: number) {
    return this.service.getHolidays(companyId, year || new Date().getFullYear());
  }

  @Post('holidays')
  @ApiOperation({ summary: 'Add holiday' })
  addHoliday(@Body() data: any) { return this.service.addHoliday(data); }
}
