import { PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Entity, Index } from 'typeorm';

export type GlobalInvoiceStatus = 'pending' | 'active' | 'cancelled';

@Entity('global_invoices')
@Index('idx_global_invoice_period', [
        'tenant_id',
        'fiscal_configuration_id',
        'period_year',
        'period_month',
    ])
@Index('idx_global_invoice_branch', [
        'tenant_id',
        'billing_branch_id',
        'period_year',
        'period_month',
    ])
@Index('uq_global_invoice_active', ['tenant_id', 'active_key'], { unique: true })
export class GlobalInvoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenant_id: string;

  @Column()
  fiscal_configuration_id: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  billing_branch_id: string | null;

  @Column({ type: 'smallint' })
  period_year: number;

  @Column({ type: 'tinyint' })
  period_month: number;

  @Column({ type: 'varchar', length: 16 })
  status: GlobalInvoiceStatus;

  @Column({ type: 'varchar', length: 80, nullable: true })
  active_key: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  electronic_invoice_id: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  created_by: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  process_folio: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}

