import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SyncService } from './sync.service';

@ApiTags('Sync')
@Controller('sync')
export class SyncController {
  constructor(private readonly service: SyncService) {}

  @Post('attendance')
  @ApiOperation({ summary: 'Sync attendance from agent' })
  syncAttendance(@Body() records: any[]) {
    return this.service.processAttendance(records);
  }

  @Post('users')
  @ApiOperation({ summary: 'Sync users from agent' })
  syncUsers(@Body() users: any[]) {
    return this.service.processUsers(users);
  }

  @Post('status')
  @ApiOperation({ summary: 'Receive agent status' })
  receiveStatus(@Body() status: any) {
    return this.service.processStatus(status);
  }
}
