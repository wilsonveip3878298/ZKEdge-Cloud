import { Controller, Get, Post, Param, Query, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PayrollService } from './payroll.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Response } from 'express';

@ApiTags('Payroll')
@UseGuards(JwtAuthGuard)
@Controller('payroll')
export class PayrollController {
  constructor(private readonly service: PayrollService) {}

  @Get()
  @ApiOperation({ summary: 'List payrolls' })
  list(@CurrentUser('companyId') companyId: string) { return this.service.list(companyId); }

  @Post('generate')
  @ApiOperation({ summary: 'Generate payroll' })
  generate(@CurrentUser('companyId') companyId: string, @Query('period') period: string, @Query('year') year: number, @Query('month') month: number) {
    return this.service.generate(companyId, period, year, month);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve payroll' })
  approve(@Param('id') id: string) { return this.service.approve(id); }
}
