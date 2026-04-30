import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RBACModule } from '../rbac/rbac.module';
import { ExchangeRate } from '../../entities/billing/exchange-rate.entity';
import { ExchangeRateController } from './exchange-rate.controller';
import { ExchangeRateService } from './exchange-rate.service';

@Module({
  imports: [TypeOrmModule.forFeature([ExchangeRate]), RBACModule],
  controllers: [ExchangeRateController],
  providers: [ExchangeRateService],
  exports: [ExchangeRateService],
})
export class ExchangeRateModule {}
