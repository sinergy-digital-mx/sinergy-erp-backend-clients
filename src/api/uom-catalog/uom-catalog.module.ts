import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UoMCatalog } from '../../entities/products/uom-catalog.entity';
import { UoMCatalogController } from './uom-catalog.controller';
import { UoMCatalogService } from './uom-catalog.service';

@Module({
  imports: [TypeOrmModule.forFeature([UoMCatalog])],
  controllers: [UoMCatalogController],
  providers: [UoMCatalogService],
  exports: [UoMCatalogService],
})
export class UoMCatalogModule {}
