import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UoMCatalog } from '../../entities/uom-catalog/uom-catalog.entity';
import { UoMCatalogController } from './uom-catalog.controller';
import { UoMCatalogService } from './uom-catalog.service';
import { RBACModule } from '../rbac/rbac.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UoMCatalog]),
    RBACModule,
  ],
  controllers: [UoMCatalogController],
  providers: [UoMCatalogService],
  exports: [UoMCatalogService],
})
export class UoMCatalogModule {}
