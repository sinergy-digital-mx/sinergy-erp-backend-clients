import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';
import { randomUUID } from 'crypto';
import { CustomerDebtLedgerMovementType } from '../../entities/accounting/customer-debt-ledger-movement-type.enum';
import {
  applyDebtLedgerBalances,
  billingBranchLabel,
  chargeSourceKey,
  customerDebtDisplayName,
  debtDueDate,
  paymentSourceKey,
  roundDebtMoney,
} from '../../api/accounting/utils/customer-debt-ledger.util';

type OrderBackfillRow = {
  id: string;
  tenant_id: string;
  customer_id: number;
  fiscal_configuration_id: string;
  billing_branch_id: string | null;
  folio: string;
  total: string | number;
  created_at: string | Date;
  created_by: string | null;
  is_credit: number | boolean;
  name: string | null;
  lastname: string | null;
  company_name: string | null;
  fiscal_razon_social: string | null;
  fiscal_rfc: string | null;
  company_razon_social: string;
  branch_city: string | null;
  branch_code: string | null;
  credit_days: number | string | null;
};

type DebtBackfillDraft = {
  tenantId: string;
  customerId: number;
  fiscalConfigurationId: string;
  salesOrderId: string;
  fiscalRazonSocial: string;
  billingBranchId: string | null;
  billingBranchName: string | null;
  folio: string;
  customerName: string;
  customerRfc: string | null;
  dueDate: string;
  sourceKey: string;
  movementType: CustomerDebtLedgerMovementType;
  amountDelta: number;
  occurredAt: Date;
  salesOrderPaymentId: string | null;
  paymentMethod: string | null;
  referenceNumber: string | null;
  source: string | null;
  createdBy: string | null;
};

type PaymentBackfillRow = {
  id: string;
  tenant_id: string;
  sales_order_id: string;
  amount: string | number;
  payment_method: string;
  reference_number: string | null;
  source: string | null;
  created_by: string | null;
  created_at: string | Date;
};

/**
 * Kardex de deuda del cliente y carga del histórico ya capturado
 * (crédito POS y ventas a plazo con sus abonos).
 */
export class CreateCustomerDebtLedger1790600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasTable('acc_customer_debt_ledger');
    if (!exists) {
      await this.createTable(queryRunner);
    }
    await this.backfill(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasTable('acc_customer_debt_ledger');
    if (exists) {
      await queryRunner.dropTable('acc_customer_debt_ledger');
    }
  }

  private async createTable(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'acc_customer_debt_ledger',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'tenant_id', type: 'varchar', length: '36', isNullable: false },
          { name: 'source_key', type: 'varchar', length: '80', isNullable: false },
          { name: 'customer_id', type: 'int', isNullable: false },
          { name: 'fiscal_configuration_id', type: 'varchar', length: '36', isNullable: false },
          { name: 'fiscal_razon_social', type: 'varchar', length: '255', isNullable: false },
          { name: 'billing_branch_id', type: 'varchar', length: '36', isNullable: true },
          { name: 'billing_branch_name', type: 'varchar', length: '255', isNullable: true },
          { name: 'sales_order_id', type: 'varchar', length: '36', isNullable: false },
          { name: 'sales_order_payment_id', type: 'varchar', length: '36', isNullable: true },
          {
            name: 'movement_type',
            type: 'enum',
            enum: ['charge', 'payment', 'charge_reversal', 'payment_reversal'],
            isNullable: false,
          },
          { name: 'amount_delta', type: 'decimal', precision: 14, scale: 2, isNullable: false },
          { name: 'balance_after', type: 'decimal', precision: 14, scale: 2, isNullable: false },
          {
            name: 'order_balance_after',
            type: 'decimal',
            precision: 14,
            scale: 2,
            isNullable: false,
          },
          { name: 'occurred_at', type: 'timestamp', isNullable: false },
          { name: 'due_date', type: 'date', isNullable: true },
          { name: 'payment_method', type: 'varchar', length: '40', isNullable: true },
          { name: 'reference_number', type: 'varchar', length: '120', isNullable: true },
          { name: 'source', type: 'varchar', length: '20', isNullable: true },
          { name: 'folio', type: 'varchar', length: '20', isNullable: false },
          { name: 'customer_name', type: 'varchar', length: '255', isNullable: false },
          { name: 'customer_rfc', type: 'varchar', length: '20', isNullable: true },
          { name: 'created_by', type: 'varchar', length: '36', isNullable: true },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
    );

    await queryRunner.createIndex(
      'acc_customer_debt_ledger',
      new TableIndex({
        name: 'uq_customer_debt_ledger_source',
        columnNames: ['tenant_id', 'source_key'],
        isUnique: true,
      }),
    );
    await queryRunner.createIndex(
      'acc_customer_debt_ledger',
      new TableIndex({
        name: 'idx_customer_debt_ledger_fiscal',
        columnNames: ['tenant_id', 'fiscal_configuration_id', 'occurred_at'],
      }),
    );
    await queryRunner.createIndex(
      'acc_customer_debt_ledger',
      new TableIndex({
        name: 'idx_customer_debt_ledger_customer',
        columnNames: ['tenant_id', 'customer_id', 'fiscal_configuration_id', 'occurred_at'],
      }),
    );
    await queryRunner.createIndex(
      'acc_customer_debt_ledger',
      new TableIndex({
        name: 'idx_customer_debt_ledger_order',
        columnNames: ['tenant_id', 'sales_order_id'],
      }),
    );

    const foreignKeys: TableForeignKey[] = [
      new TableForeignKey({
        name: 'fk_customer_debt_ledger_tenant',
        columnNames: ['tenant_id'],
        referencedTableName: 'rbac_tenants',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        name: 'fk_customer_debt_ledger_customer',
        columnNames: ['customer_id'],
        referencedTableName: 'customers',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
      new TableForeignKey({
        name: 'fk_customer_debt_ledger_fiscal',
        columnNames: ['fiscal_configuration_id'],
        referencedTableName: 'fiscal_configurations',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
      new TableForeignKey({
        name: 'fk_customer_debt_ledger_branch',
        columnNames: ['billing_branch_id'],
        referencedTableName: 'billing_branches',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
      new TableForeignKey({
        name: 'fk_customer_debt_ledger_order',
        columnNames: ['sales_order_id'],
        referencedTableName: 'inv_s_sales_orders',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
      new TableForeignKey({
        name: 'fk_customer_debt_ledger_payment',
        columnNames: ['sales_order_payment_id'],
        referencedTableName: 'inv_s_sales_order_payments',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
      new TableForeignKey({
        name: 'fk_customer_debt_ledger_user',
        columnNames: ['created_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    ];

    for (const foreignKey of foreignKeys) {
      await queryRunner.createForeignKey('acc_customer_debt_ledger', foreignKey);
    }
  }

  private async backfill(queryRunner: QueryRunner): Promise<void> {
    const already = await queryRunner.query(
      `SELECT id FROM acc_customer_debt_ledger LIMIT 1`,
    );
    if (already.length > 0) return;

    const orders: OrderBackfillRow[] = await queryRunner.query(`
      SELECT
        so.id, so.tenant_id, so.customer_id, so.fiscal_configuration_id,
        so.billing_branch_id, so.folio, so.total, so.created_at, so.created_by, so.is_credit,
        c.name, c.lastname, c.company_name, c.fiscal_razon_social, c.fiscal_rfc,
        fc.razon_social AS company_razon_social,
        bb.city AS branch_city, bb.code AS branch_code,
        cc.credit_days
      FROM inv_s_sales_orders so
      INNER JOIN customers c ON c.id = so.customer_id
      INNER JOIN fiscal_configurations fc ON fc.id = so.fiscal_configuration_id
      LEFT JOIN billing_branches bb ON bb.id = so.billing_branch_id
      LEFT JOIN customer_credits cc
        ON cc.tenant_id = so.tenant_id
       AND cc.customer_id = so.customer_id
       AND cc.fiscal_configuration_id = so.fiscal_configuration_id
      WHERE so.general_status NOT IN ('Cancelada', 'En cola')
        AND so.total > 0
        AND NOT (
          c.fiscal_razon_social = 'VENTA DE MOSTRADOR'
          OR c.name = 'Público en General'
        )
        AND (
          so.is_credit = 1
          OR (
            so.sales_order_type <> 'POS'
            AND (
              so.payment_status = 'Pendiente'
              OR EXISTS (
                SELECT 1 FROM inv_s_sales_order_payments p
                WHERE p.sales_order_id = so.id
              )
            )
          )
        )
    `);
    if (!orders.length) return;

    const payments: PaymentBackfillRow[] = await queryRunner.query(`
      SELECT p.id, p.tenant_id, p.sales_order_id, p.amount, p.payment_method,
             p.reference_number, p.source, p.created_by, p.created_at
      FROM inv_s_sales_order_payments p
      INNER JOIN inv_s_sales_orders so ON so.id = p.sales_order_id
      INNER JOIN customers c ON c.id = so.customer_id
      WHERE p.payment_method <> 'credit'
        AND so.general_status NOT IN ('Cancelada', 'En cola')
        AND so.total > 0
        AND NOT (
          c.fiscal_razon_social = 'VENTA DE MOSTRADOR'
          OR c.name = 'Público en General'
        )
        AND (
          so.is_credit = 1
          OR (
            so.sales_order_type <> 'POS'
            AND (
              so.payment_status = 'Pendiente'
              OR EXISTS (
                SELECT 1 FROM inv_s_sales_order_payments p2
                WHERE p2.sales_order_id = so.id
              )
            )
          )
        )
    `);

    const paymentsByOrder = new Map<string, PaymentBackfillRow[]>();
    for (const payment of payments) {
      const list = paymentsByOrder.get(payment.sales_order_id) ?? [];
      list.push(payment);
      paymentsByOrder.set(payment.sales_order_id, list);
    }

    const drafts: DebtBackfillDraft[] = [];
    for (const order of orders) {
      const chargeAt = parseSqlDate(order.created_at);
      const dueDate = debtDueDate(chargeAt, order.credit_days != null ? Number(order.credit_days) : null);
      const customerName = customerDebtDisplayName(order).slice(0, 255);
      const branchName = billingBranchLabel(order.branch_city, order.branch_code);
      const shared = {
        tenantId: order.tenant_id,
        customerId: Number(order.customer_id),
        fiscalConfigurationId: order.fiscal_configuration_id,
        salesOrderId: order.id,
        fiscalRazonSocial: (order.company_razon_social || '').slice(0, 255),
        billingBranchId: order.billing_branch_id,
        billingBranchName: branchName,
        folio: order.folio.slice(0, 20),
        customerName,
        customerRfc: order.fiscal_rfc?.trim().slice(0, 20) || null,
        dueDate,
      };

      drafts.push({
        ...shared,
        sourceKey: chargeSourceKey(order.id),
        movementType: CustomerDebtLedgerMovementType.CHARGE,
        amountDelta: roundDebtMoney(Number(order.total || 0)),
        occurredAt: chargeAt,
        salesOrderPaymentId: null as string | null,
        paymentMethod: null as string | null,
        referenceNumber: null as string | null,
        source: order.is_credit ? 'pos_cobranza' : 'manual',
        createdBy: order.created_by || null,
      });

      const orderPayments = paymentsByOrder.get(order.id) ?? [];
      orderPayments.forEach((payment, index) => {
        let occurredAt = parseSqlDate(payment.created_at);
        if (occurredAt.getTime() <= chargeAt.getTime()) {
          occurredAt = new Date(chargeAt.getTime() + (index + 1) * 1000);
        }
        drafts.push({
          ...shared,
          sourceKey: paymentSourceKey(payment.id),
          movementType: CustomerDebtLedgerMovementType.PAYMENT,
          amountDelta: -roundDebtMoney(Number(payment.amount || 0)),
          occurredAt,
          salesOrderPaymentId: payment.id,
          paymentMethod: payment.payment_method,
          referenceNumber: payment.reference_number,
          source: payment.source || 'manual',
          createdBy: payment.created_by || null,
        });
      });
    }

    const balanced = applyDebtLedgerBalances(drafts);
    const chunkSize = 80;
    for (let offset = 0; offset < balanced.length; offset += chunkSize) {
      const chunk = balanced.slice(offset, offset + chunkSize);
      const placeholders = chunk.map(() => '(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').join(',');
      const params: unknown[] = [];
      for (const row of chunk) {
        const occurred = formatSqlDateTime(row.occurredAt);
        params.push(
          randomUUID(),
          row.tenantId,
          row.sourceKey,
          row.customerId,
          row.fiscalConfigurationId,
          row.fiscalRazonSocial,
          row.billingBranchId,
          row.billingBranchName,
          row.salesOrderId,
          row.salesOrderPaymentId,
          row.movementType,
          row.amountDelta,
          row.balanceAfter,
          row.orderBalanceAfter,
          occurred,
          row.dueDate,
          row.paymentMethod,
          row.referenceNumber,
          row.source,
          row.folio,
          row.customerName,
          row.customerRfc,
          row.createdBy,
          occurred,
        );
      }
      await queryRunner.query(
        `
        INSERT INTO acc_customer_debt_ledger (
          id, tenant_id, source_key, customer_id, fiscal_configuration_id, fiscal_razon_social,
          billing_branch_id, billing_branch_name, sales_order_id, sales_order_payment_id,
          movement_type, amount_delta, balance_after, order_balance_after, occurred_at, due_date,
          payment_method, reference_number, source, folio, customer_name, customer_rfc,
          created_by, created_at
        ) VALUES ${placeholders}
        `,
        params,
      );
    }
  }
}

function parseSqlDate(value: string | Date): Date {
  if (value instanceof Date) return value;
  const parsed = new Date(String(value).replace(' ', 'T'));
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function formatSqlDateTime(value: Date): string {
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())} ${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`;
}
