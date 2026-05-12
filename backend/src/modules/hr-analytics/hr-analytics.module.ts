import { Module } from '@nestjs/common';
import { HRAnalyticsController } from './hr-analytics.controller';
import { HRAnalyticsService } from './hr-analytics.service';

@Module({
  controllers: [HRAnalyticsController],
  providers: [HRAnalyticsService],
})
export class HRAnalyticsModule {}
