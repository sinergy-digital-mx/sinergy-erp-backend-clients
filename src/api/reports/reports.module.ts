import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ExchangeRateModule } from '../exchange-rate/exchange-rate.module';
import { RBACModule } from '../rbac/rbac.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [AuthModule, RBACModule, ExchangeRateModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
