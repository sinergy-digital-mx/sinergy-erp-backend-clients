import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../../entities/products/product.entity';
import { ProductUoM } from '../../entities/products/product-uom.entity';
import { PriceList } from '../../entities/products/price-list.entity';
import { ProductPrice } from '../../entities/products/product-price.entity';
import { ProductVendorCost } from '../../entities/products/product-vendor-cost.entity';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { ProductUoMController } from './product-uom.controller';
import { ProductUoMService } from './product-uom.service';
import { PriceListController } from './price-list.controller';
import { PriceListService } from './price-list.service';
import { ProductPriceController } from './product-price.controller';
import { ProductPriceService } from './product-price.service';
import { ProductVendorCostController } from './product-vendor-cost.controller';
import { ProductVendorCostService } from './product-vendor-cost.service';
import { RBACModule } from '../rbac/rbac.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductUoM, PriceList, ProductPrice, ProductVendorCost]),
    RBACModule,
  ],
  controllers: [
    ProductController,
    ProductUoMController,
    PriceListController,
    ProductPriceController,
    ProductVendorCostController,
  ],
  providers: [
    ProductService,
    ProductUoMService,
    PriceListService,
    ProductPriceService,
    ProductVendorCostService,
  ],
  exports: [
    ProductService,
    ProductUoMService,
    PriceListService,
    ProductPriceService,
    ProductVendorCostService,
  ],
})
export class ProductsModule {}
