import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryAudit } from '../../../entities/inventory/inventory-audit.entity';

@Injectable()
export class InventoryAuditFolioService {
  constructor(
    @InjectRepository(InventoryAudit)
    private readonly auditRepo: Repository<InventoryAudit>,
  ) {}

  /** Formato: AUD-000001 — secuencial por organización */
  async generateFolio(tenantId: string): Promise<string> {
    const result = await this.auditRepo
      .createQueryBuilder('audit')
      .select(
        "MAX(CAST(SUBSTRING_INDEX(audit.folio, '-', -1) AS UNSIGNED))",
        'maxSeq',
      )
      .where('audit.tenant_id = :tenantId', { tenantId })
      .andWhere("audit.folio LIKE 'AUD-%'")
      .getRawOne<{ maxSeq: string | null }>();

    const maxSeq = result?.maxSeq ? Number(result.maxSeq) : 0;
    const next = maxSeq > 0 ? maxSeq + 1 : 1;
    return `AUD-${String(next).padStart(6, '0')}`;
  }
}
