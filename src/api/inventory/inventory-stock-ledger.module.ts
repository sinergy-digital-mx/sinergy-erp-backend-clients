import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryStockLedger } from '../../entities/inventory/inventory-stock-ledger.entity';
import { InventoryStockLedgerService } from './services/inventory-stock-ledger.service';
import { InventoryStockLedgerValuationService } from './services/inventory-stock-ledger-valuation.service';

/**
 * Módulo delgado del kardex para evitar dependencias circulares
 * (PurchaseOrders ↔ Inventory).
 */
@Module({
  imports: [TypeOrmModule.forFeature([InventoryStockLedger])],
  providers: [
    InventoryStockLedgerService,
    InventoryStockLedgerValuationService,
  ],
  exports: [
    InventoryStockLedgerService,
    InventoryStockLedgerValuationService,
    TypeOrmModule,
  ],
})
export class InventoryStockLedgerModule {}
