import { Controller, Get, Post, Body, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AgentUpdatesService } from './agent-updates.service';

@ApiTags('Agent Updates')
@Controller('agent/updates')
export class AgentUpdatesController {
  constructor(private readonly service: AgentUpdatesService) {}

  @Get('latest')
  @ApiOperation({ summary: 'Check for latest agent version' })
  checkLatest(
    @Headers('x-agent-version') version: string,
    @Headers('x-agent-os') os: string,
    @Headers('x-agent-arch') arch: string,
  ) {
    return this.service.checkLatest(version, os, arch);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new agent version' })
  registerVersion(@Body() data: any) {
    return this.service.registerVersion(data);
  }
}
