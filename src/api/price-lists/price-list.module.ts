import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PriceList } from '../../entities/products/price-list.entity';
import { ProductPrice } from '../../entities/products/product-price.entity';
import { PriceListService } from './price-list.service';
import { PriceListController } from './price-list.controller';
import { RBACModule } from '../rbac/rbac.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PriceList, ProductPrice]),
    RBACModule,
  ],
  controllers: [PriceListController],
  providers: [PriceListService],
  exports: [PriceListService],
})
export class PriceListModule {}
