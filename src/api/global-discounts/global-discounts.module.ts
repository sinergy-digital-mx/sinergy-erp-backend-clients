import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GlobalDiscount } from '../../entities/global-discounts/global-discount.entity';
import { GlobalDiscountController } from './global-discount.controller';
import { GlobalDiscountService } from './global-discount.service';
import { RBACModule } from '../rbac/rbac.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GlobalDiscount]),
    AuthModule,
    RBACModule,
  ],
  controllers: [GlobalDiscountController],
  providers: [GlobalDiscountService],
  exports: [GlobalDiscountService],
})
export class GlobalDiscountsModule {}
