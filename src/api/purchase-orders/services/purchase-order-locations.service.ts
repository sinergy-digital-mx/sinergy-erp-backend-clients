import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BillingBranch } from '../../../entities/billing/billing-branch.entity';
import { FiscalConfiguration } from '../../../entities/billing/fiscal-configuration.entity';
import { Warehouse } from '../../../entities/warehouse/warehouse.entity';
import {
  buildPurchaseOrderLocationTree,
  PurchaseOrderLocationTree,
} from '../utils/purchase-order-location.util';

@Injectable()
export class PurchaseOrderLocationsService {
  constructor(
    @InjectRepository(FiscalConfiguration)
    private readonly fiscalConfigRepository: Repository<FiscalConfiguration>,
    @InjectRepository(BillingBranch)
    private readonly billingBranchRepository: Repository<BillingBranch>,
    @InjectRepository(Warehouse)
    private readonly warehouseRepository: Repository<Warehouse>,
  ) {}

  async getLocationTree(tenantId: string): Promise<PurchaseOrderLocationTree> {
    const [fiscals, branches, warehouses] = await Promise.all([
      this.fiscalConfigRepository.find({
        where: { tenant_id: tenantId },
        order: { created_at: 'ASC' },
      }),
      this.billingBranchRepository
        .createQueryBuilder('branch')
        .innerJoin('branch.fiscal_configuration', 'fc')
        .where('fc.tenant_id = :tenantId', { tenantId })
        .orderBy('branch.code', 'ASC')
        .getMany(),
      this.warehouseRepository.find({
        where: { tenant_id: tenantId },
        order: { name: 'ASC' },
      }),
    ]);
    return buildPurchaseOrderLocationTree(fiscals, branches, warehouses);
  }
}
