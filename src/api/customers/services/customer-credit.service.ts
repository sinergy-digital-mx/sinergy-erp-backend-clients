import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { Customer } from '../../../entities/customers/customer.entity';
import { CustomerCredit } from '../../../entities/customers/customer-credit.entity';
import { FiscalConfiguration } from '../../../entities/billing/fiscal-configuration.entity';
import { SalesOrder } from '../../../entities/sales-orders/sales-order.entity';
import { SalesOrderPayment } from '../../../entities/sales-orders/sales-order-payment.entity';
import { ElectronicInvoice } from '../../../entities/electronic-invoicing/electronic-invoice.entity';
import { Quotation } from '../../../entities/quotations/quotation.entity';
import {
  isInvoiceVigente,
  roundCreditMoney,
  splitCreditNoteEffect,
} from '../../sales-orders/utils/credit-note.util';
import { isWalkInCustomer } from '../../pos-shifts/mappers/pos-sale-collection.mapper';
import { ExchangeRateService } from '../../exchange-rate/exchange-rate.service';
import { UpsertCustomerCreditItemDto } from '../dto/upsert-customer-credit.dto';
import {
  amountInCreditCurrency,
  CreditCurrency,
  creditConversionRate,
  creditRateDate,
  normalizeCreditCurrency,
} from '../utils/credit-currency.util';
import {
  buildCreditSnapshot,
  creditChargeUsesExceedWaiver,
  CustomerCreditFiscalSnapshot,
  CustomerCreditSnapshot,
} from '../utils/customer-credit.util';
import {
  advanceCreditPending,
  roundAdvanceMoney,
} from '../utils/advance-credit.util';

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
    @InjectRepository(ElectronicInvoice)
    private readonly invoiceRepo: Repository<ElectronicInvoice>,
    @InjectRepository(Quotation)
    private readonly quotationRepo: Repository<Quotation>,
    private readonly exchangeRateService: ExchangeRateService,
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

  async consumeExceedWaiver(
    tenantId: string,
    customerId: number,
    fiscalConfigurationId: string,
  ): Promise<void> {
    await this.creditRepo.update(
      {
        tenant_id: tenantId,
        customer_id: customerId,
        fiscal_configuration_id: fiscalConfigurationId,
        allow_credit_exceed: true,
      },
      { allow_credit_exceed: false },
    );
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
      allowCreditExceed: Boolean(row?.allow_credit_exceed),
      creditDays: row?.credit_days,
      creditAmount: row?.credit_amount,
      creditCurrency: row?.credit_currency,
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

      const existing = await this.creditRepo.findOne({
        where: {
          tenant_id: customer.tenant_id,
          customer_id: customer.id,
          fiscal_configuration_id: item.fiscal_configuration_id,
        },
      });

      this.assertCreditItem(
        item,
        fiscal.razon_social,
        used,
        normalizeCreditCurrency(existing?.credit_currency ?? item.credit_currency),
      );

      const nextCurrency = normalizeCreditCurrency(
        item.credit_currency ?? existing?.credit_currency,
      );
      if (
        existing &&
        used > 0.009 &&
        normalizeCreditCurrency(existing.credit_currency) !== nextCurrency
      ) {
        throw new BadRequestException(
          `No se puede cambiar la moneda del crédito de ${fiscal.razon_social}: hay saldo utilizado`,
        );
      }

      if (existing) {
        existing.credit_enabled = item.credit_enabled;
        existing.allow_credit_exceed = item.credit_enabled
          ? Boolean(item.allow_credit_exceed)
          : false;
        existing.credit_days = item.credit_enabled ? (item.credit_days ?? 0) : null;
        existing.credit_amount = item.credit_enabled
          ? Number(item.credit_amount)
          : null;
        existing.credit_currency = item.credit_enabled
          ? nextCurrency
          : normalizeCreditCurrency(existing.credit_currency);
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
          allow_credit_exceed: item.credit_enabled
            ? Boolean(item.allow_credit_exceed)
            : false,
          credit_days: item.credit_enabled ? (item.credit_days ?? 0) : null,
          credit_amount: item.credit_enabled ? Number(item.credit_amount) : null,
          credit_currency: item.credit_enabled ? nextCurrency : 'MXN',
        }),
      );
    }

    return this.listForCustomer(customer);
  }

  private assertCreditItem(
    item: UpsertCustomerCreditItemDto,
    razonSocial: string,
    used: number,
    currency: CreditCurrency,
  ): void {
    if (!item.credit_enabled) {
      if (used > 0) {
        throw new BadRequestException(
          `No se puede desactivar el crédito de ${razonSocial}: el cliente tiene ${used.toFixed(2)} ${currency} utilizados`,
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
        allowCreditExceed: Boolean(row?.allow_credit_exceed),
        creditDays: row?.credit_days,
        creditAmount: row?.credit_amount,
        creditCurrency: row?.credit_currency,
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
      select: [
        'id',
        'total',
        'general_status',
        'fiscal_configuration_id',
        'currency',
        'exchange_rate',
        'created_at',
      ],
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

    const noteRows = await this.invoiceRepo.find({
      where: {
        tenant_id: tenantId,
        source_module: 'sales_orders',
        source_id: In(openOrders.map((order) => order.id)),
        invoice_role: 'credit_note',
      },
    });
    const notesByOrder = new Map<string, number>();
    for (const invoice of noteRows) {
      if (!isInvoiceVigente(invoice)) continue;
      notesByOrder.set(
        invoice.source_id,
        roundCreditMoney((notesByOrder.get(invoice.source_id) ?? 0) + Number(invoice.total || 0)),
      );
    }

    const creditRows = await this.creditRepo.find({
      where: { tenant_id: tenantId, customer_id: customerId },
      select: ['fiscal_configuration_id', 'credit_currency'],
    });
    const currencyByFiscal = new Map(
      creditRows.map((row) => [
        row.fiscal_configuration_id,
        normalizeCreditCurrency(row.credit_currency),
      ]),
    );

    const coverage = await this.orderAdvanceCoverageMap(
      tenantId,
      openOrders.map((order) => order.id),
    );

    const rateByDate = new Map<string, number | null>();
    const rateForOrderDate = async (
      createdAt: Date | string | null | undefined,
    ): Promise<number | null> => {
      const date = creditRateDate(createdAt);
      if (!date) {
        return null;
      }
      if (rateByDate.has(date)) {
        return rateByDate.get(date) ?? null;
      }
      const daily = await this.exchangeRateService.getDailyRate(tenantId, date);
      const value = Number(daily?.exchange_rate ?? 0);
      const rate = value > 0 ? value : null;
      rateByDate.set(date, rate);
      return rate;
    };

    for (const order of openOrders) {
      const effect = splitCreditNoteEffect({
        orderTotal: Number(order.total || 0),
        amountPaid: paidByOrder.get(order.id) ?? 0,
        creditNotesTotal: notesByOrder.get(order.id) ?? 0,
      });
      const cover = coverage.get(order.id);
      const creditBase = cover?.hasAdvance
        ? Math.min(
            effect.pendingAfter,
            advanceCreditPending(Number(order.total || 0), cover.requested, cover.paid),
          )
        : effect.pendingAfter;
      const key = order.fiscal_configuration_id;
      const creditCurrency = currencyByFiscal.get(key) ?? 'MXN';
      const storedRate = Number(order.exchange_rate);
      const momentRate =
        storedRate > 0 ? storedRate : await rateForOrderDate(order.created_at);
      const rate = creditConversionRate({
        orderCurrency: order.currency,
        creditCurrency,
        orderExchangeRate: storedRate,
        dailyExchangeRate: momentRate,
      });
      const converted = amountInCreditCurrency({
        amount: creditBase,
        orderCurrency: order.currency,
        creditCurrency,
        exchangeRate: rate,
      });
      const pending = converted.amount ?? creditBase;
      usedByFiscal.set(key, Number(((usedByFiscal.get(key) ?? 0) + pending).toFixed(2)));
    }

    return usedByFiscal;
  }

  async assertAdvanceCreditFits(input: {
    tenantId: string;
    customerId: number;
    fiscalConfigurationId: string;
    currency?: string | null;
    exchangeRate?: number | null;
    createdAt?: Date | string | null;
    previousPending: number;
    nextPending: number;
  }): Promise<void> {
    const previous = roundAdvanceMoney(input.previousPending);
    const next = roundAdvanceMoney(input.nextPending);
    if (next - previous <= 0.009) {
      return;
    }
    if (!input.fiscalConfigurationId) {
      throw new BadRequestException(
        'El documento no tiene razón social para aplicar crédito',
      );
    }
    const customer = await this.creditRepo.manager.getRepository(Customer).findOne({
      where: { id: input.customerId, tenant_id: input.tenantId },
    });
    if (!customer) {
      throw new BadRequestException('Cliente no encontrado');
    }
    if (isWalkInCustomer(customer)) {
      throw new BadRequestException(
        'El cliente de mostrador no puede dejar saldo a crédito',
      );
    }
    const snapshot = await this.getSnapshotForFiscal(
      customer,
      input.fiscalConfigurationId,
    );
    if (!snapshot.credit_enabled) {
      throw new BadRequestException(
        'El cliente no tiene crédito activo con esta razón social',
      );
    }
    const storedRate = Number(input.exchangeRate);
    const momentRate =
      storedRate > 0 ? storedRate : await this.rateForDate(input.tenantId, input.createdAt);
    const exchangeRate = creditConversionRate({
      orderCurrency: input.currency,
      creditCurrency: snapshot.credit_currency,
      orderExchangeRate: storedRate,
      dailyExchangeRate: momentRate,
    });
    const nextConverted = amountInCreditCurrency({
      amount: next,
      orderCurrency: input.currency,
      creditCurrency: snapshot.credit_currency,
      exchangeRate,
    });
    const previousConverted = amountInCreditCurrency({
      amount: previous,
      orderCurrency: input.currency,
      creditCurrency: snapshot.credit_currency,
      exchangeRate,
    });
    if (nextConverted.error || nextConverted.amount == null || previousConverted.amount == null) {
      throw new BadRequestException(
        nextConverted.error || 'No hay tipo de cambio para convertir el crédito',
      );
    }
    const increase = roundAdvanceMoney(nextConverted.amount - previousConverted.amount);
    if (increase <= snapshot.credit_available + 0.009) {
      return;
    }
    if (
      creditChargeUsesExceedWaiver(
        increase,
        snapshot.credit_available,
        snapshot.allow_credit_exceed,
      )
    ) {
      await this.consumeExceedWaiver(
        input.tenantId,
        input.customerId,
        input.fiscalConfigurationId,
      );
      return;
    }
    throw new BadRequestException(
      `Crédito insuficiente. Disponible: ${snapshot.credit_available.toFixed(2)} ${snapshot.credit_currency}`,
    );
  }

  private async rateForDate(
    tenantId: string,
    createdAt: Date | string | null | undefined,
  ): Promise<number | null> {
    const daily = await this.exchangeRateService.getDailyRate(
      tenantId,
      creditRateDate(createdAt) ?? undefined,
    );
    const value = Number(daily?.exchange_rate ?? 0);
    return value > 0 ? value : null;
  }

  async advanceCoverageForOrder(
    tenantId: string,
    orderId: string,
  ): Promise<{ hasAdvance: boolean; requested: number; paid: number }> {
    const coverage = await this.orderAdvanceCoverageMap(tenantId, [orderId]);
    return coverage.get(orderId) ?? { hasAdvance: false, requested: 0, paid: 0 };
  }

  private async orderAdvanceCoverageMap(
    tenantId: string,
    orderIds: string[],
  ): Promise<Map<string, { hasAdvance: boolean; requested: number; paid: number }>> {
    const result = new Map<
      string,
      { hasAdvance: boolean; requested: number; paid: number }
    >();
    if (orderIds.length === 0) {
      return result;
    }

    const [paymentRows, quotations, invoices] = await Promise.all([
      this.paymentRepo
        .createQueryBuilder('payment')
        .select('payment.sales_order_id', 'sales_order_id')
        .addSelect('COALESCE(SUM(payment.amount), 0)', 'paid')
        .addSelect(
          `COALESCE(SUM(CASE WHEN payment.source = 'advance' THEN payment.amount ELSE 0 END), 0)`,
          'advance',
        )
        .where('payment.tenant_id = :tenantId', { tenantId })
        .andWhere('payment.sales_order_id IN (:...ids)', { ids: orderIds })
        .groupBy('payment.sales_order_id')
        .getRawMany<{ sales_order_id: string; paid: string; advance: string }>(),
      this.quotationRepo.find({
        where: { tenant_id: tenantId, converted_to_sales_order_id: In(orderIds) },
        select: ['id', 'converted_to_sales_order_id', 'advance_requested_total'],
      }),
      this.invoiceRepo.find({
        where: {
          tenant_id: tenantId,
          source_id: In(orderIds),
          invoice_role: 'advance',
        },
      }),
    ]);

    const paidByOrder = new Map(
      paymentRows.map((row) => [
        row.sales_order_id,
        { paid: Number(row.paid || 0), advance: Number(row.advance || 0) },
      ]),
    );
    const requestedByOrder = new Map<string, number>();
    for (const quote of quotations) {
      if (!quote.converted_to_sales_order_id) continue;
      const requested = Number(quote.advance_requested_total || 0);
      if (requested > 0.009) {
        requestedByOrder.set(quote.converted_to_sales_order_id, requested);
      }
    }
    const invoiceTotalByOrder = new Map<string, number>();
    for (const invoice of invoices) {
      if (!isInvoiceVigente(invoice)) continue;
      invoiceTotalByOrder.set(
        invoice.source_id,
        roundAdvanceMoney((invoiceTotalByOrder.get(invoice.source_id) ?? 0) + Number(invoice.total || 0)),
      );
    }

    for (const orderId of orderIds) {
      const paid = paidByOrder.get(orderId)?.paid ?? 0;
      const advancePaid = paidByOrder.get(orderId)?.advance ?? 0;
      const requested =
        requestedByOrder.get(orderId) ??
        (advancePaid > 0.009 ? advancePaid : invoiceTotalByOrder.get(orderId) ?? 0);
      const hasAdvance =
        requested > 0.009 || advancePaid > 0.009 || invoiceTotalByOrder.has(orderId);
      result.set(orderId, { hasAdvance, requested, paid });
    }

    return result;
  }
}
