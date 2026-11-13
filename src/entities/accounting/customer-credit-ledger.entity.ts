import { PrimaryColumn, Column, CreateDateColumn, Entity, Index } from 'typeorm';

export type CustomerCreditLedgerEntryType = 'credit' | 'reversal';

export type CustomerCreditLedgerCurrency = 'MXN' | 'USD';

@Entity('customer_credit_ledger')
@Index('uq_customer_credit_ledger_invoice', ['tenant_id', 'electronic_invoice_id', 'entry_type'], {
        unique: true,
    })
export class CustomerCreditLedger {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ type: 'varchar', length: 36 })
  tenant_id: string;

  @Column({ type: 'int' })
  customer_id: number;

  @Column({ type: 'varchar', length: 36 })
  fiscal_configuration_id: string;

  @Column({ type: 'enum', enum: ['MXN', 'USD'] })
  currency: CustomerCreditLedgerCurrency;

  @Column({ type: 'enum', enum: ['credit', 'reversal'] })
  entry_type: CustomerCreditLedgerEntryType;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 36 })
  sales_order_id: string;

  @Column({ type: 'varchar', length: 36 })
  electronic_invoice_id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  notes: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  created_by: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}

