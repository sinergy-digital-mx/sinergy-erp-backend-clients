import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quotation } from '../../../entities/quotations/quotation.entity';

@Injectable()
export class QuotationFolioService {
  constructor(
    @InjectRepository(Quotation)
    private readonly quotationRepo: Repository<Quotation>,
  ) {}

  /** Formato: COT-000001 — secuencial por organización. */
  async generateFolio(tenantId: string): Promise<string> {
    const result = await this.quotationRepo
      .createQueryBuilder('qt')
      .select(
        "MAX(CAST(SUBSTRING_INDEX(qt.folio, '-', -1) AS UNSIGNED))",
        'maxSeq',
      )
      .where('qt.tenant_id = :tenantId', { tenantId })
      .andWhere("qt.folio LIKE 'COT-%'")
      .getRawOne<{ maxSeq: string | null }>();

    const maxSeq = result?.maxSeq ? Number(result.maxSeq) : 0;
    const next = maxSeq > 0 ? maxSeq + 1 : 1;
    return `COT-${String(next).padStart(6, '0')}`;
  }
}
