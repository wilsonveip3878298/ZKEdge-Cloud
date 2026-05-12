import { Controller, Get, Post, Body, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EdgeService } from './edge.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';

@ApiTags('Edge Computing')
@Controller('edge')
export class EdgeController {
  constructor(private readonly service: EdgeService) {}

  @Get('nodes')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List all edge nodes' })
  listNodes(@Query('companyId') companyId?: string) {
    return this.service.listNodes(companyId);
  }

  @Get('nodes/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get edge node details' })
  getNode(@Param('id') id: string) {
    return this.service.getNode(id);
  }

  @Get('nodes/:id/health')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get edge node health' })
  getNodeHealth(@Param('id') id: string) {
    return this.service.getNodeHealth(id);
  }

  @Post('nodes/:id/commands')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Send command to edge node' })
  sendCommand(@Param('id') id: string, @Body() command: any) {
    return this.service.sendCommand(id, command);
  }

  @Get('dead-letter')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List dead letter queue' })
  listDeadLetter(@Query('nodeId') nodeId?: string) {
    return this.service.listDeadLetter(nodeId);
  }

  @Post('dead-letter/:id/retry')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Retry dead letter item' })
  retryDeadLetter(@Param('id') id: string) {
    return this.service.retryDeadLetter(id);
  }

  @Post('nodes/:id/sync')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Trigger sync on edge node' })
  triggerSync(@Param('id') id: string) {
    return this.service.triggerSync(id);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Edge computing stats' })
  getStats() {
    return this.service.getStats();
  }

  @Post('heartbeat')
  @ApiOperation({ summary: 'Agent heartbeat (no auth)' })
  heartbeat(@Body() data: any) {
    return this.service.processHeartbeat(data);
  }

  @Post('health')
  @ApiOperation({ summary: 'Receive agent health report' })
  receiveHealth(@Body() data: any) {
    return this.service.processHealth(data);
  }
}
