import { Module } from '@nestjs/common';
import { AgentUpdatesController } from './agent-updates.controller';
import { AgentUpdatesService } from './agent-updates.service';

@Module({
  controllers: [AgentUpdatesController],
  providers: [AgentUpdatesService],
})
export class AgentUpdatesModule {}
