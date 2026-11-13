import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import {
  CustomerCreditLedger,
  CustomerCreditLedgerCurrency,
} from '../../../entities/accounting/customer-credit-ledger.entity';
import { roundDebtMoney } from '../utils/customer-debt-ledger.util';

@Injectable()
export class CustomerCreditLedgerService {
  constructor(
    @InjectRepository(CustomerCreditLedger)
    private readonly ledgerRepo: Repository<CustomerCreditLedger>,
  ) {}

  async recordCredit(input: {
    tenantId: string;
    customerId: number;
    fiscalConfigurationId: string;
    currency: string;
    amount: number;
    salesOrderId: string;
    electronicInvoiceId: string;
    notes?: string | null;
    userId: string | null;
  }): Promise<void> {
    const amount = roundDebtMoney(input.amount);
    if (amount <= 0 || !input.fiscalConfigurationId || !input.customerId) return;

    const existing = await this.ledgerRepo.findOne({
      where: {
        tenant_id: input.tenantId,
        electronic_invoice_id: input.electronicInvoiceId,
        entry_type: 'credit',
      },
    });
    if (existing) return;

    await this.ledgerRepo.insert({
      id: randomUUID(),
      tenant_id: input.tenantId,
      customer_id: input.customerId,
      fiscal_configuration_id: input.fiscalConfigurationId,
      currency: this.currency(input.currency),
      entry_type: 'credit',
      amount,
      sales_order_id: input.salesOrderId,
      electronic_invoice_id: input.electronicInvoiceId,
      notes: input.notes?.trim().slice(0, 255) || null,
      created_by: input.userId,
    });
  }

  async reverseCredit(input: {
    tenantId: string;
    electronicInvoiceId: string;
    userId: string | null;
  }): Promise<void> {
    const credit = await this.ledgerRepo.findOne({
      where: {
        tenant_id: input.tenantId,
        electronic_invoice_id: input.electronicInvoiceId,
        entry_type: 'credit',
      },
    });
    if (!credit) return;

    const existing = await this.ledgerRepo.findOne({
      where: {
        tenant_id: input.tenantId,
        electronic_invoice_id: input.electronicInvoiceId,
        entry_type: 'reversal',
      },
    });
    if (existing) return;

    await this.ledgerRepo.insert({
      id: randomUUID(),
      tenant_id: credit.tenant_id,
      customer_id: credit.customer_id,
      fiscal_configuration_id: credit.fiscal_configuration_id,
      currency: credit.currency,
      entry_type: 'reversal',
      amount: roundDebtMoney(Number(credit.amount)),
      sales_order_id: credit.sales_order_id,
      electronic_invoice_id: credit.electronic_invoice_id,
      notes: 'Nota de crédito cancelada',
      created_by: input.userId,
    });
  }

  private currency(value: string | null | undefined): CustomerCreditLedgerCurrency {
    return value?.toUpperCase() === 'USD' ? 'USD' : 'MXN';
  }
}
