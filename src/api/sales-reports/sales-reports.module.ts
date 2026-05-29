import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesOrder } from '../../entities/sales-orders/sales-order.entity';
import { AuthModule } from '../auth/auth.module';
import { SalesReportsController } from './sales-reports.controller';
import { SalesReportsService } from './sales-reports.service';

@Module({
  imports: [TypeOrmModule.forFeature([SalesOrder]), AuthModule],
  controllers: [SalesReportsController],
  providers: [SalesReportsService],
})
export class SalesReportsModule {}
