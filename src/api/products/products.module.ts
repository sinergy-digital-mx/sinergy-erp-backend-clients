import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../../entities/products/product.entity';
import { ProductUoM } from '../../entities/products/product-uom.entity';
import { PriceList } from '../../entities/products/price-list.entity';
import { ProductPrice } from '../../entities/products/product-price.entity';
import { ProductDiscount } from '../../entities/products/product-discount.entity';
import { ProductVendorCost } from '../../entities/products/product-vendor-cost.entity';
import { ProductAttribute } from '../../entities/products/product-attribute.entity';
import { ProductAttributeValue } from '../../entities/products/product-attribute-value.entity';
import { ProductAttributeAssignment } from '../../entities/products/product-attribute-assignment.entity';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { ProductUoMController } from './product-uom.controller';
import { ProductUoMService } from './product-uom.service';
import { PriceListController } from './price-list.controller';
import { PriceListService } from './price-list.service';
import { ProductPriceController } from './product-price.controller';
import { ProductPriceService } from './product-price.service';
import { ProductDiscountController } from './product-discount.controller';
import { ProductDiscountService } from './product-discount.service';
import { ProductVendorCostController } from './product-vendor-cost.controller';
import { ProductVendorCostService } from './product-vendor-cost.service';
import { ProductAttributeController } from './product-attribute.controller';
import { ProductAttributeService } from './product-attribute.service';
import { ProductAttributeAssignmentController } from './product-attribute-assignment.controller';
import { ProductAttributeAssignmentService } from './product-attribute-assignment.service';
import { ProductsExportService } from './services/products-export.service';
import { RBACModule } from '../rbac/rbac.module';
import { UoMCatalogModule } from '../uom-catalog/uom-catalog.module';
import { S3Service } from '../../common/services/s3.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductUoM,
      PriceList,
      ProductPrice,
      ProductDiscount,
      ProductVendorCost,
      ProductAttribute,
      ProductAttributeValue,
      ProductAttributeAssignment,
    ]),
    RBACModule,
    UoMCatalogModule,
  ],
  controllers: [
    // ProductAttributeController must be registered before ProductController so
    // GET /tenant/products/attributes is not captured by GET /tenant/products/:id
    ProductAttributeController,
    ProductAttributeAssignmentController,
    ProductController,
    ProductUoMController,
    PriceListController,
    ProductPriceController,
    ProductDiscountController,
    ProductVendorCostController,
  ],
  providers: [
    ProductService,
    ProductUoMService,
    PriceListService,
    ProductPriceService,
    ProductDiscountService,
    ProductVendorCostService,
    ProductAttributeService,
    ProductAttributeAssignmentService,
    ProductsExportService,
    S3Service,
  ],
  exports: [
    ProductService,
    ProductUoMService,
    PriceListService,
    ProductPriceService,
    ProductDiscountService,
    ProductVendorCostService,
    ProductAttributeService,
    ProductAttributeAssignmentService,
  ],
})
export class ProductsModule {}
