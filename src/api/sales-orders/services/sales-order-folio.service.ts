import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesOrder } from '../../../entities/sales-orders/sales-order.entity';

@Injectable()
export class SalesOrderFolioService {
  constructor(
    @InjectRepository(SalesOrder)
    private readonly salesOrderRepo: Repository<SalesOrder>,
  ) {}

  /** Format: OSV-000001 — sequential per tenant */
  async generateFolio(tenantId: string): Promise<string> {
    const result = await this.salesOrderRepo
      .createQueryBuilder('so')
      .select(
        "MAX(CAST(SUBSTRING_INDEX(so.folio, '-', -1) AS UNSIGNED))",
        'maxSeq',
      )
      .where('so.tenant_id = :tenantId', { tenantId })
      .andWhere("so.folio LIKE 'OSV-%'")
      .getRawOne<{ maxSeq: string | null }>();

    const maxSeq = result?.maxSeq ? Number(result.maxSeq) : 0;
    const next = maxSeq > 0 ? maxSeq + 1 : 1;
    return `OSV-${String(next).padStart(6, '0')}`;
  }
}
