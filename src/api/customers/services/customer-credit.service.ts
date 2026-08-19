import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { Customer } from '../../../entities/customers/customer.entity';
import { CustomerCredit } from '../../../entities/customers/customer-credit.entity';
import { FiscalConfiguration } from '../../../entities/billing/fiscal-configuration.entity';
import { SalesOrder } from '../../../entities/sales-orders/sales-order.entity';
import { SalesOrderPayment } from '../../../entities/sales-orders/sales-order-payment.entity';
import { isWalkInCustomer } from '../../pos-shifts/mappers/pos-sale-collection.mapper';
import { UpsertCustomerCreditItemDto } from '../dto/upsert-customer-credit.dto';
import {
  buildCreditSnapshot,
  CustomerCreditFiscalSnapshot,
  CustomerCreditSnapshot,
} from '../utils/customer-credit.util';

@Injectable()
export class CustomerCreditService {
  constructor(
    @InjectRepository(CustomerCredit)
    private readonly creditRepo: Repository<CustomerCredit>,
    @InjectRepository(FiscalConfiguration)
    private readonly fiscalRepo: Repository<FiscalConfiguration>,
    @InjectRepository(SalesOrder)
    private readonly salesOrderRepo: Repository<SalesOrder>,
    @InjectRepository(SalesOrderPayment)
    private readonly paymentRepo: Repository<SalesOrderPayment>,
  ) {}

  async listForCustomer(customer: Customer): Promise<CustomerCreditFiscalSnapshot[]> {
    const fiscales = await this.fiscalRepo.find({
      where: { tenant_id: customer.tenant_id },
      order: { razon_social: 'ASC' },
    });
    const rows = await this.creditRepo.find({
      where: { tenant_id: customer.tenant_id, customer_id: customer.id },
    });
    const rowByFiscal = new Map(rows.map((row) => [row.fiscal_configuration_id, row]));
    const usedByFiscal = await this.getUsedByFiscal(customer.tenant_id, customer.id);

    return fiscales
      .map((fiscal) => {
        const row = rowByFiscal.get(fiscal.id);
        const used = usedByFiscal.get(fiscal.id) ?? 0;
        const include =
          fiscal.status === 'active' || Boolean(row) || used > 0;
        if (!include) {
          return null;
        }
        return this.toFiscalSnapshot(fiscal, row, used);
      })
      .filter((item): item is CustomerCreditFiscalSnapshot => item != null);
  }

  async getSnapshotForFiscal(
    customer: Customer,
    fiscalConfigurationId: string,
  ): Promise<CustomerCreditSnapshot> {
    const [row, used] = await Promise.all([
      this.creditRepo.findOne({
        where: {
          tenant_id: customer.tenant_id,
          customer_id: customer.id,
          fiscal_configuration_id: fiscalConfigurationId,
        },
      }),
      this.getUsedCredit(customer.tenant_id, customer.id, fiscalConfigurationId),
    ]);

    return buildCreditSnapshot({
      creditEnabled: Boolean(row?.credit_enabled),
      creditDays: row?.credit_days,
      creditAmount: row?.credit_amount,
      creditUsed: used,
    });
  }

  async getUsedCredit(
    tenantId: string,
    customerId: number,
    fiscalConfigurationId: string,
  ): Promise<number> {
    const usedByFiscal = await this.getUsedByFiscal(tenantId, customerId);
    return usedByFiscal.get(fiscalConfigurationId) ?? 0;
  }

  async getEnabledByFiscalMap(
    tenantId: string,
    pairs: Array<{ customerId: number; fiscalConfigurationId: string }>,
  ): Promise<Map<string, boolean>> {
    const result = new Map<string, boolean>();
    if (pairs.length === 0) {
      return result;
    }

    const customerIds = [...new Set(pairs.map((pair) => pair.customerId))];
    const rows = await this.creditRepo.find({
      where: {
        tenant_id: tenantId,
        customer_id: In(customerIds),
        credit_enabled: true,
      },
      select: ['id', 'customer_id', 'fiscal_configuration_id', 'credit_enabled'],
    });
    const enabled = new Set(
      rows.map((row) => `${row.customer_id}:${row.fiscal_configuration_id}`),
    );

    for (const pair of pairs) {
      const key = `${pair.customerId}:${pair.fiscalConfigurationId}`;
      result.set(key, enabled.has(key));
    }
    return result;
  }

  async upsertForAllActiveFiscales(
    customer: Customer,
    patch: {
      credit_enabled: boolean;
      credit_days?: number | null;
      credit_amount?: number | null;
    },
  ): Promise<CustomerCreditFiscalSnapshot[]> {
    const fiscales = await this.fiscalRepo.find({
      where: { tenant_id: customer.tenant_id, status: 'active' },
    });
    if (fiscales.length === 0) {
      throw new BadRequestException(
        'No hay razones sociales activas para asignar crédito',
      );
    }
    return this.upsertMany(
      customer,
      fiscales.map((fiscal) => ({
        fiscal_configuration_id: fiscal.id,
        credit_enabled: patch.credit_enabled,
        credit_days: patch.credit_days,
        credit_amount: patch.credit_amount,
      })),
    );
  }

  async upsertMany(
    customer: Customer,
    items: UpsertCustomerCreditItemDto[],
  ): Promise<CustomerCreditFiscalSnapshot[]> {
    if (isWalkInCustomer(customer)) {
      throw new BadRequestException(
        'El cliente de mostrador no puede tener crédito activo',
      );
    }

    const fiscalIds = [...new Set(items.map((item) => item.fiscal_configuration_id))];
    if (fiscalIds.length !== items.length) {
      throw new BadRequestException(
        'No se puede repetir la misma razón social en el mismo guardado',
      );
    }

    const fiscales = await this.fiscalRepo.find({
      where: { tenant_id: customer.tenant_id, id: In(fiscalIds) },
    });
    if (fiscales.length !== fiscalIds.length) {
      throw new BadRequestException('Razón social no válida');
    }
    const fiscalById = new Map(fiscales.map((fiscal) => [fiscal.id, fiscal]));
    const usedByFiscal = await this.getUsedByFiscal(customer.tenant_id, customer.id);

    for (const item of items) {
      const fiscal = fiscalById.get(item.fiscal_configuration_id)!;
      const used = usedByFiscal.get(item.fiscal_configuration_id) ?? 0;
      this.assertCreditItem(item, fiscal.razon_social, used);

      const existing = await this.creditRepo.findOne({
        where: {
          tenant_id: customer.tenant_id,
          customer_id: customer.id,
          fiscal_configuration_id: item.fiscal_configuration_id,
        },
      });

      if (existing) {
        existing.credit_enabled = item.credit_enabled;
        existing.credit_days = item.credit_enabled ? (item.credit_days ?? 0) : null;
        existing.credit_amount = item.credit_enabled
          ? Number(item.credit_amount)
          : null;
        await this.creditRepo.save(existing);
        continue;
      }

      await this.creditRepo.save(
        this.creditRepo.create({
          id: randomUUID(),
          tenant_id: customer.tenant_id,
          customer_id: customer.id,
          fiscal_configuration_id: item.fiscal_configuration_id,
          credit_enabled: item.credit_enabled,
          credit_days: item.credit_enabled ? (item.credit_days ?? 0) : null,
          credit_amount: item.credit_enabled ? Number(item.credit_amount) : null,
        }),
      );
    }

    return this.listForCustomer(customer);
  }

  private assertCreditItem(
    item: UpsertCustomerCreditItemDto,
    razonSocial: string,
    used: number,
  ): void {
    if (!item.credit_enabled) {
      if (used > 0) {
        throw new BadRequestException(
          `No se puede desactivar el crédito de ${razonSocial}: el cliente tiene ${used.toFixed(2)} MXN utilizados`,
        );
      }
      return;
    }

    if (item.credit_amount == null || Number(item.credit_amount) <= 0) {
      throw new BadRequestException(
        `credit_amount es obligatorio y debe ser mayor a 0 para ${razonSocial}`,
      );
    }
    if (item.credit_days == null || Number(item.credit_days) < 0) {
      throw new BadRequestException(
        `credit_days es obligatorio para ${razonSocial}`,
      );
    }
  }

  private toFiscalSnapshot(
    fiscal: FiscalConfiguration,
    row: CustomerCredit | undefined,
    used: number,
  ): CustomerCreditFiscalSnapshot {
    return {
      fiscal_configuration_id: fiscal.id,
      razon_social: fiscal.razon_social,
      rfc: fiscal.rfc,
      fiscal_status: fiscal.status,
      ...buildCreditSnapshot({
        creditEnabled: Boolean(row?.credit_enabled),
        creditDays: row?.credit_days,
        creditAmount: row?.credit_amount,
        creditUsed: used,
      }),
    };
  }

  private async getUsedByFiscal(
    tenantId: string,
    customerId: number,
  ): Promise<Map<string, number>> {
    const usedByFiscal = new Map<string, number>();
    const orders = await this.salesOrderRepo.find({
      where: {
        tenant_id: tenantId,
        customer_id: customerId,
        is_credit: true,
      },
      select: ['id', 'total', 'general_status', 'fiscal_configuration_id'],
    });

    const openOrders = orders.filter(
      (order) =>
        order.general_status !== 'Cancelada' && Boolean(order.fiscal_configuration_id),
    );
    if (openOrders.length === 0) {
      return usedByFiscal;
    }

    const paidRows: Array<{ sales_order_id: string; paid: string }> =
      await this.paymentRepo
        .createQueryBuilder('p')
        .select('p.sales_order_id', 'sales_order_id')
        .addSelect('COALESCE(SUM(p.amount), 0)', 'paid')
        .where('p.tenant_id = :tenantId', { tenantId })
        .andWhere('p.sales_order_id IN (:...ids)', {
          ids: openOrders.map((order) => order.id),
        })
        .groupBy('p.sales_order_id')
        .getRawMany();

    const paidByOrder = new Map(
      paidRows.map((row) => [row.sales_order_id, Number(row.paid || 0)]),
    );

    for (const order of openOrders) {
      const pending = Math.max(
        Number(order.total || 0) - (paidByOrder.get(order.id) ?? 0),
        0,
      );
      const key = order.fiscal_configuration_id;
      usedByFiscal.set(key, Number(((usedByFiscal.get(key) ?? 0) + pending).toFixed(2)));
    }

    return usedByFiscal;
  }
}
