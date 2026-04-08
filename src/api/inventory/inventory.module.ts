import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryBatch } from '../../entities/purchase-orders/inventory-batch.entity';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { RBACModule } from '../rbac/rbac.module';

@Module({
  imports: [TypeOrmModule.forFeature([InventoryBatch]), RBACModule],
  providers: [InventoryService],
  controllers: [InventoryController],
  exports: [InventoryService],
})
export class InventoryModule {}
