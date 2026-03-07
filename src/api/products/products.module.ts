import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../../entities/products/product.entity';
import { UoM } from '../../entities/products/uom.entity';
import { UoMCatalog } from '../../entities/products/uom-catalog.entity';
import { UoMRelationship } from '../../entities/products/uom-relationship.entity';
import { VendorProductPrice } from '../../entities/products/vendor-product-price.entity';
import { ProductPhoto } from '../../entities/products/product-photo.entity';
import { ProductRepository } from './repositories/product.repository';
import { UoMRepository } from './repositories/uom.repository';
import { UoMCatalogRepository } from './repositories/uom-catalog.repository';
import { UoMRelationshipRepository } from './repositories/uom-relationship.repository';
import { VendorProductPriceRepository } from './repositories/vendor-product-price.repository';
import { ProductPhotoRepository } from './repositories/product-photo.repository';
import { ProductService } from './services/product.service';
import { UoMService } from './services/uom.service';
import { VendorProductPriceService } from './services/vendor-product-price.service';
import { ProductPhotoService } from './services/product-photo.service';
import { ProductController } from './controllers/product.controller';
import { UoMController } from './controllers/uom.controller';
import { VendorProductPriceController } from './controllers/vendor-product-price.controller';
import { ProductPhotoController } from './controllers/product-photo.controller';
import { S3Service } from '../../common/services/s3.service';
import { RBACModule } from '../rbac/rbac.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      UoM,
      UoMCatalog,
      UoMRelationship,
      VendorProductPrice,
      ProductPhoto,
    ]),
    RBACModule,
  ],
  providers: [
    ProductRepository,
    UoMRepository,
    UoMCatalogRepository,
    UoMRelationshipRepository,
    VendorProductPriceRepository,
    ProductPhotoRepository,
    ProductService,
    UoMService,
    VendorProductPriceService,
    ProductPhotoService,
    S3Service,
  ],
  controllers: [
    ProductController,
    UoMController,
    VendorProductPriceController,
    ProductPhotoController,
  ],
  exports: [
    ProductService,
    UoMService,
    VendorProductPriceService,
    ProductPhotoService,
  ],
})
export class ProductsModule {}
