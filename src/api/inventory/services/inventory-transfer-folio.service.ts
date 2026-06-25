import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryTransfer } from '../../../entities/inventory/inventory-transfer.entity';

@Injectable()
export class InventoryTransferFolioService {
  constructor(
    @InjectRepository(InventoryTransfer)
    private readonly transferRepo: Repository<InventoryTransfer>,
  ) {}

  /** Formato: TRF-000001 — secuencial por organización */
  async generateFolio(tenantId: string): Promise<string> {
    const result = await this.transferRepo
      .createQueryBuilder('transfer')
      .select(
        "MAX(CAST(SUBSTRING_INDEX(transfer.folio, '-', -1) AS UNSIGNED))",
        'maxSeq',
      )
      .where('transfer.tenant_id = :tenantId', { tenantId })
      .andWhere("transfer.folio LIKE 'TRF-%'")
      .getRawOne<{ maxSeq: string | null }>();

    const maxSeq = result?.maxSeq ? Number(result.maxSeq) : 0;
    const next = maxSeq > 0 ? maxSeq + 1 : 1;
    return `TRF-${String(next).padStart(6, '0')}`;
  }
}
