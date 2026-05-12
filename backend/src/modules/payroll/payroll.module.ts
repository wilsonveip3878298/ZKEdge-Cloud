import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PayrollController } from './payroll.controller';
import { PayrollService } from './payroll.service';
import { Payroll } from './payroll.entity';
import { PayrollItem } from './payroll-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Payroll, PayrollItem])],
  controllers: [PayrollController],
  providers: [PayrollService],
})
export class PayrollModule {}
