import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesOrder } from '../../entities/sales-orders/sales-order.entity';
import { AuthModule } from '../auth/auth.module';
import { RBACModule } from '../rbac/rbac.module';
import { CustomerSalesReportsController } from './customer-sales-reports.controller';
import { CustomerSalesReportsService } from './customer-sales-reports.service';

@Module({
  imports: [TypeOrmModule.forFeature([SalesOrder]), AuthModule, RBACModule],
  controllers: [CustomerSalesReportsController],
  providers: [CustomerSalesReportsService],
})
export class CustomerSalesReportsModule {}
