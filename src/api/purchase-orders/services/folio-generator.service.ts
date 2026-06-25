import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseOrderBatch } from '../../../entities/purchase-orders/purchase-order-batch.entity';

@Injectable()
export class FolioGeneratorService {
  constructor(
    @InjectRepository(PurchaseOrderBatch)
    private readonly purchaseOrderBatchRepository: Repository<PurchaseOrderBatch>,
  ) {}

  /**
   * Generate a unique folio for a purchase order within a tenant.
   * Format: ODC-{6-digit zero-padded number}
   */
  async generateFolio(tenantId: string): Promise<string> {
    const result = await this.purchaseOrderBatchRepository
      .createQueryBuilder('po')
      .select(
        "MAX(CAST(SUBSTRING_INDEX(po.folio, '-', -1) AS UNSIGNED))",
        'maxSeq',
      )
      .where('po.tenant_id = :tenantId', { tenantId })
      .andWhere("po.folio LIKE 'ODC-%'")
      .getRawOne<{ maxSeq: string | null }>();

    const maxSeq = result?.maxSeq ? Number(result.maxSeq) : 0;
    const nextNumber = maxSeq > 0 ? maxSeq + 1 : 1;
    const paddedNumber = String(nextNumber).padStart(6, '0');
    return `ODC-${paddedNumber}`;
  }
}
