import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VendorController } from './vendor.controller';
import { VendorService } from './vendor.service';
import { VendorsExportService } from './services/vendors-export.service';
import { Vendor } from '../../entities/vendor/vendor.entity';
import { VendorCreditLedger } from '../../entities/vendor/vendor-credit-ledger.entity';
import { PurchaseOrderBatch } from '../../entities/purchase-orders/purchase-order-batch.entity';
import { RBACModule } from '../rbac/rbac.module';
import { VendorCreditLedgerService } from './services/vendor-credit-ledger.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vendor, VendorCreditLedger, PurchaseOrderBatch]),
    RBACModule,
  ],
  providers: [VendorService, VendorsExportService, VendorCreditLedgerService],
  controllers: [VendorController],
  exports: [VendorService, VendorCreditLedgerService],
})
export class VendorModule {}
