import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowController } from './workflow.controller';
import { WorkflowService } from './workflow.service';
import { HRRequest } from './request.entity';

@Module({
  imports: [TypeOrmModule.forFeature([HRRequest])],
  controllers: [WorkflowController],
  providers: [WorkflowService],
})
export class WorkflowModule {}
