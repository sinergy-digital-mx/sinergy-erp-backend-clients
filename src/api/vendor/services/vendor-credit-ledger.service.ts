import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vendor } from '../../../entities/vendor/vendor.entity';
import { VendorCreditLedger } from '../../../entities/vendor/vendor-credit-ledger.entity';
import { VendorCreditLedgerEntryType } from '../../../entities/vendor/vendor-credit-ledger-entry-type.enum';
import { PurchaseOrderBatch } from '../../../entities/purchase-orders/purchase-order-batch.entity';
import { resolvePurchaseOrderPayableTotal } from '../../purchase-orders/utils/purchase-order-payable-total.util';
import { vendorCompanyName } from '../utils/vendor-profile.util';
import {
  normalizeVendorCreditCurrency,
  roundVendorCreditMoney,
  vendorCreditBalances,
  vendorCreditNet,
  VendorCreditCurrency,
  withRunningVendorCreditBalance,
} from '../utils/vendor-credit-ledger.util';

export type VendorCreditCreated = {
  amount: number;
  currency: VendorCreditCurrency;
  balance_after: number;
};

export type VendorCreditBalanceRow = {
  vendor_id: string;
  mxn: number;
  usd: number;
};

type PendingBucket = { count: number; amount: number };

@Injectable()
export class VendorCreditLedgerService {
  constructor(
    @InjectRepository(VendorCreditLedger)
    private readonly ledgerRepo: Repository<VendorCreditLedger>,
    @InjectRepository(Vendor)
    private readonly vendorRepo: Repository<Vendor>,
    @InjectRepository(PurchaseOrderBatch)
    private readonly purchaseOrderRepo: Repository<PurchaseOrderBatch>,
  ) {}

  async recordCredit(input: {
    tenantId: string;
    vendorId: string;
    userId: string;
    amount: number;
    currency: VendorCreditCurrency;
    purchaseOrderId?: string | null;
    purchaseOrderPaymentId?: string | null;
    notes?: string | null;
  }): Promise<VendorCreditCreated | null> {
    const amount = roundVendorCreditMoney(input.amount);
    if (amount <= 0) return null;

    const entry = this.ledgerRepo.create({
      tenant_id: input.tenantId,
      vendor_id: input.vendorId,
      currency: input.currency,
      entry_type: VendorCreditLedgerEntryType.CREDIT,
      amount,
      purchase_order_id: input.purchaseOrderId ?? null,
      purchase_order_payment_id: input.purchaseOrderPaymentId ?? null,
      notes: input.notes ?? 'Excedente de pago',
      created_by: input.userId,
    });
    await this.ledgerRepo.save(entry);

    const balances = await this.balancesForVendor(input.tenantId, input.vendorId);
    return {
      amount,
      currency: input.currency,
      balance_after: input.currency === 'USD' ? balances.usd : balances.mxn,
    };
  }

  async assertPaymentVoidable(tenantId: string, paymentId: string): Promise<void> {
    const credits = await this.ledgerRepo.find({
      where: {
        tenant_id: tenantId,
        purchase_order_payment_id: paymentId,
        entry_type: VendorCreditLedgerEntryType.CREDIT,
      },
    });
    if (!credits.length) return;

    const creditIds = credits.map((row) => row.id);
    const applied = await this.ledgerRepo
      .createQueryBuilder('entry')
      .where('entry.tenant_id = :tenantId', { tenantId })
      .andWhere('entry.entry_type = :type', { type: VendorCreditLedgerEntryType.DEBIT })
      .andWhere('entry.source_entry_id IN (:...creditIds)', { creditIds })
      .getCount();
    if (applied > 0) {
      throw new BadRequestException(
        'Ese pago ya generó un saldo a favor que se aplicó a otra orden. Desaplicalo antes de borrar el pago.',
      );
    }
  }

  async voidByPayment(tenantId: string, userId: string, paymentId: string): Promise<void> {
    const credits = await this.ledgerRepo.find({
      where: {
        tenant_id: tenantId,
        purchase_order_payment_id: paymentId,
        entry_type: VendorCreditLedgerEntryType.CREDIT,
      },
    });
    if (!credits.length) return;

    await this.assertPaymentVoidable(tenantId, paymentId);

    for (const credit of credits) {
      const alreadyVoided = await this.ledgerRepo.exists({
        where: {
          tenant_id: tenantId,
          source_entry_id: credit.id,
          entry_type: VendorCreditLedgerEntryType.VOID,
        },
      });
      if (alreadyVoided) continue;
      await this.ledgerRepo.save(
        this.ledgerRepo.create({
          tenant_id: tenantId,
          vendor_id: credit.vendor_id,
          currency: credit.currency,
          entry_type: VendorCreditLedgerEntryType.VOID,
          amount: credit.amount,
          purchase_order_id: credit.purchase_order_id,
          purchase_order_payment_id: paymentId,
          source_entry_id: credit.id,
          notes: 'Reverso por pago eliminado',
          created_by: userId,
        }),
      );
    }
  }

  async balancesForVendor(
    tenantId: string,
    vendorId: string,
    fiscalConfigurationId?: string,
  ): Promise<{ mxn: number; usd: number }> {
    if (!fiscalConfigurationId) {
      const entries = await this.ledgerRepo.find({
        where: { tenant_id: tenantId, vendor_id: vendorId },
      });
      return vendorCreditBalances(entries);
    }
    const entries = await this.ledgerRepo
      .createQueryBuilder('entry')
      .innerJoin('entry.purchase_order', 'purchase_order')
      .where('entry.tenant_id = :tenantId', { tenantId })
      .andWhere('entry.vendor_id = :vendorId', { vendorId })
      .andWhere('purchase_order.fiscal_configuration_id = :fiscalConfigurationId', {
        fiscalConfigurationId,
      })
      .getMany();
    return vendorCreditBalances(entries);
  }

  async balancesByVendor(
    tenantId: string,
    fiscalConfigurationId?: string,
  ): Promise<VendorCreditBalanceRow[]> {
    const qb = this.ledgerRepo
      .createQueryBuilder('entry')
      .select('entry.vendor_id', 'vendor_id')
      .addSelect('entry.currency', 'currency')
      .addSelect(
        `SUM(CASE
          WHEN entry.entry_type = 'credit' THEN entry.amount
          ELSE -entry.amount
        END)`,
        'balance',
      )
      .where('entry.tenant_id = :tenantId', { tenantId });
    if (fiscalConfigurationId) {
      qb.innerJoin('entry.purchase_order', 'purchase_order').andWhere(
        'purchase_order.fiscal_configuration_id = :fiscalConfigurationId',
        { fiscalConfigurationId },
      );
    }
    const rows: Array<{ vendor_id: string; currency: string; balance: string | number | null }> =
      await qb
        .groupBy('entry.vendor_id')
        .addGroupBy('entry.currency')
        .getRawMany();

    const map = new Map<string, VendorCreditBalanceRow>();
    for (const row of rows) {
      const current = map.get(row.vendor_id) ?? { vendor_id: row.vendor_id, mxn: 0, usd: 0 };
      const amount = roundVendorCreditMoney(Number(row.balance || 0));
      if (normalizeVendorCreditCurrency(row.currency) === 'USD') {
        current.usd = amount;
      } else {
        current.mxn = amount;
      }
      map.set(row.vendor_id, current);
    }
    return Array.from(map.values()).filter((row) => row.mxn > 0 || row.usd > 0);
  }

  async describeAccounts(tenantId: string, vendorId: string) {
    const vendor = await this.vendorRepo.findOne({ where: { id: vendorId, tenant_id: tenantId } });
    if (!vendor) {
      throw new NotFoundException(`Proveedor no encontrado: ${vendorId}`);
    }

    const [credit, pending] = await Promise.all([
      this.balancesForVendor(tenantId, vendorId),
      this.pendingByCurrency(tenantId, vendorId),
    ]);

    const entries = await this.ledgerRepo.find({
      where: { tenant_id: tenantId, vendor_id: vendorId },
      relations: ['purchase_order'],
      order: { created_at: 'ASC' },
    });
    const ledger = withRunningVendorCreditBalance(entries).reverse().slice(0, 40);

    return {
      vendor: {
        id: vendor.id,
        name: vendorCompanyName(vendor),
        razon_social: vendor.razon_social,
        company_name: vendor.company_name,
      },
      mxn: this.currencyBucket(pending.mxn, credit.mxn),
      usd: this.currencyBucket(pending.usd, credit.usd),
      ledger: ledger.map((entry) => ({
        id: entry.id,
        created_at: entry.created_at,
        entry_type: entry.entry_type,
        amount: Number(entry.amount),
        currency: entry.currency,
        folio: entry.purchase_order?.folio ?? null,
        notes: entry.notes,
        balance_after: entry.balance_after,
      })),
    };
  }

  private currencyBucket(pending: PendingBucket, credit: number) {
    return {
      pending_order_count: pending.count,
      amount_pending: pending.amount,
      credit_balance: credit,
      net: vendorCreditNet(pending.amount, credit),
    };
  }

  private async pendingByCurrency(
    tenantId: string,
    vendorId: string,
  ): Promise<{ mxn: PendingBucket; usd: PendingBucket }> {
    const orders = await this.purchaseOrderRepo.find({
      where: {
        tenant_id: tenantId,
        vendor_id: vendorId,
        payment_status: 'Pendiente',
      },
      relations: ['payments'],
    });
    const buckets = {
      mxn: { count: 0, amount: 0 },
      usd: { count: 0, amount: 0 },
    };
    for (const order of orders) {
      if (order.general_status === 'Cancelada') continue;
      const total = resolvePurchaseOrderPayableTotal(order);
      const paid = (order.payments ?? []).reduce(
        (sum, payment) => sum + Number(payment.amount || 0),
        0,
      );
      const pending = roundVendorCreditMoney(Math.max(0, total - paid));
      if (pending <= 0) continue;
      const bucket =
        normalizeVendorCreditCurrency(order.payment_currency) === 'USD' ? buckets.usd : buckets.mxn;
      bucket.count += 1;
      bucket.amount = roundVendorCreditMoney(bucket.amount + pending);
    }
    return buckets;
  }
}
