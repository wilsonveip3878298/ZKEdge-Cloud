import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from '@modules/auth/auth.module';
import { CompaniesModule } from '@modules/companies/companies.module';
import { BranchesModule } from '@modules/branches/branches.module';
import { DevicesModule } from '@modules/devices/devices.module';
import { EmployeesModule } from '@modules/employees/employees.module';
import { AttendanceModule } from '@modules/attendance/attendance.module';
import { SyncModule } from '@modules/sync/sync.module';
import { ReportsModule } from '@modules/reports/reports.module';
import { AuditModule } from '@modules/audit/audit.module';
import { RealtimeModule } from '@modules/realtime/realtime.module';
import { EdgeModule } from '@modules/edge/edge.module';
import { AgentUpdatesModule } from '@modules/agent-updates/agent-updates.module';
import { SchedulesModule } from '@modules/schedules/schedules.module';
import { PayrollModule } from '@modules/payroll/payroll.module';
import { WorkflowModule } from '@modules/workflow/workflow.module';
import { HRAnalyticsModule } from '@modules/hr-analytics/hr-analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule], inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres', host: config.get('DB_HOST', 'localhost'), port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USER', 'sistema'), password: config.get('DB_PASSWORD', 'sistema'),
        database: config.get('DB_NAME', 'sistema'), autoLoadEntities: true,
        synchronize: config.get('NODE_ENV') !== 'production',
      }),
    }),
    ScheduleModule.forRoot(),
    AuthModule, CompaniesModule, BranchesModule, DevicesModule, AttendanceModule,
    SyncModule, ReportsModule, AuditModule, RealtimeModule,
    EdgeModule, AgentUpdatesModule, SchedulesModule, PayrollModule, WorkflowModule, HRAnalyticsModule,
    EmployeesModule,
  ],
})
export class AppModule {}
