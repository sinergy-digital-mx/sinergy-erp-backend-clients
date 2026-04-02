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
   * Generate a unique folio for a purchase order
   * Format: ODC-{6-digit zero-padded number}
   * @param tenantId - The tenant ID
   * @returns The generated folio
   */
  async generateFolio(tenantId: string): Promise<string> {
    // Get the highest folio number for this tenant
    const lastOrder = await this.purchaseOrderBatchRepository
      .createQueryBuilder('po')
      .where('po.tenant_id = :tenantId', { tenantId })
      .orderBy('po.created_at', 'DESC')
      .take(1)
      .getOne();

    let nextNumber = 1;

    if (lastOrder && lastOrder.folio) {
      // Extract the number from the folio (e.g., "ODC-000001" -> 1)
      const match = lastOrder.folio.match(/ODC-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    // Format with 6-digit zero-padding
    const paddedNumber = String(nextNumber).padStart(6, '0');
    return `ODC-${paddedNumber}`;
  }
}
