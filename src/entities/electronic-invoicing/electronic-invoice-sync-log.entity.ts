import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { RBACTenant } from '../rbac/tenant.entity';
import { ElectronicInvoice } from './electronic-invoice.entity';
import { User } from '../users/user.entity';

export type ElectronicInvoiceSyncTrigger = 'scheduled' | 'manual' | 'batch';

@Entity('electronic_invoice_sync_logs')
@Index('tenant_index', ['tenant_id'])
@Index('idx_eisl_invoice', ['electronic_invoice_id'])
export class ElectronicInvoiceSyncLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  @ManyToOne(() => ElectronicInvoice, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'electronic_invoice_id' })
  electronic_invoice: ElectronicInvoice | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  electronic_invoice_id: string | null;

  @Column({
    type: 'enum',
    enum: ['scheduled', 'manual', 'batch'],
    default: 'scheduled',
  })
  trigger_type: ElectronicInvoiceSyncTrigger;

  @Column({ type: 'varchar', length: 50, nullable: true })
  previous_sat_status: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  new_sat_status: string | null;

  @Column({ type: 'json', nullable: true })
  raw_response: Record<string, unknown> | null;

  @Column({ type: 'tinyint', default: 1 })
  success: number;

  @Column({ type: 'text', nullable: true })
  error_message: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'triggered_by' })
  triggered_by_user: User | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  triggered_by: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
