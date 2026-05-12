import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WorkflowService } from './workflow.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';

@ApiTags('Workflow')
@UseGuards(JwtAuthGuard)
@Controller('workflow')
export class WorkflowController {
  constructor(private readonly service: WorkflowService) {}

  @Get()
  @ApiOperation({ summary: 'List HR requests' })
  list(@CurrentUser('companyId') companyId: string, @Query('status') status?: string) {
    return this.service.list(companyId, status);
  }

  @Post()
  @ApiOperation({ summary: 'Create request' })
  create(@Body() data: any, @CurrentUser('companyId') companyId: string) {
    return this.service.create({ ...data, companyId });
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve request' })
  approve(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.approve(id, userId);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject request' })
  reject(@Param('id') id: string, @Body('reason') reason: string) {
    return this.service.reject(id, reason);
  }
}
