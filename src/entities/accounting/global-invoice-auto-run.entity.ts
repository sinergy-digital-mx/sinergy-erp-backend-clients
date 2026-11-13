import { PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Entity, Index } from 'typeorm';

export type GlobalInvoiceAutoRunStatus = 'running' | 'done' | 'failed' | 'skipped';

@Entity('global_invoice_auto_runs')
@Index('uq_global_invoice_auto_run', ['billing_branch_id', 'period_year', 'period_month'], {
        unique: true,
    })
export class GlobalInvoiceAutoRun {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenant_id: string;

  @Column()
  fiscal_configuration_id: string;

  @Column()
  billing_branch_id: string;

  @Column({ type: 'smallint' })
  period_year: number;

  @Column({ type: 'tinyint' })
  period_month: number;

  @Column({ type: 'varchar', length: 32 })
  folio: string;

  @Column({ type: 'varchar', length: 16 })
  status: GlobalInvoiceAutoRunStatus;

  @Column({ type: 'text', nullable: true })
  message: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  global_invoice_id: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}

