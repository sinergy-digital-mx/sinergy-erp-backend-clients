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

  /** Format: OSV-000001 */
  async generateFolio(tenantId: string): Promise<string> {
    const last = await this.salesOrderRepo
      .createQueryBuilder('so')
      .where('so.tenant_id = :tenantId', { tenantId })
      .orderBy('so.created_at', 'DESC')
      .take(1)
      .getOne();

    let next = 1;
    if (last?.folio) {
      const match = last.folio.match(/OSV-(\d+)/);
      if (match) next = parseInt(match[1], 10) + 1;
    }

    return `OSV-${String(next).padStart(6, '0')}`;
  }
}
