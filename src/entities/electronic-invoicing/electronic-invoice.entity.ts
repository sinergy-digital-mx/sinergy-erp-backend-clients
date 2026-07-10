import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { RBACTenant } from '../rbac/tenant.entity';
import { FiscalConfiguration } from '../billing/fiscal-configuration.entity';
import { User } from '../users/user.entity';

export type ElectronicInvoiceSourceModule = 'sales_orders';
export type ElectronicInvoiceStampStatus =
  | 'pending_stamp'
  | 'stamped'
  | 'stamp_error'
  | 'cancel_pending'
  | 'cancelled'
  | 'cancel_error';

export type ElectronicInvoiceSatStatus =
  | 'Vigente'
  | 'Cancelado'
  | 'No Encontrado'
  | 'Desconocido'
  | null;

@Entity('electronic_invoices')
@Index('tenant_index', ['tenant_id'])
@Index('idx_ei_source', ['tenant_id', 'source_module', 'source_id'])
@Index('idx_ei_uuid', ['uuid'])
@Index('idx_ei_sat_sync', ['stamp_status', 'sat_last_sync_at'])
export class ElectronicInvoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  @ManyToOne(() => FiscalConfiguration, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'fiscal_configuration_id' })
  fiscal_configuration: FiscalConfiguration;

  @Column()
  fiscal_configuration_id: string;

  /** Módulo origen que construyó el XML (sales_orders, etc.) */
  @Column({ type: 'varchar', length: 50 })
  source_module: ElectronicInvoiceSourceModule;

  /** ID del documento origen (ej. sales_order.id) */
  @Column({ type: 'varchar', length: 36 })
  source_id: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  uuid: string | null;

  @Column({ type: 'varchar', length: 25, nullable: true })
  series: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  folio: string | null;

  @Column({ type: 'varchar', length: 5, default: 'I' })
  tipo_comprobante: string;

  @Column({ type: 'varchar', length: 13 })
  rfc_emisor: string;

  @Column({ type: 'varchar', length: 13 })
  rfc_receptor: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  receptor_nombre: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  total: number;

  @Column({ type: 'varchar', length: 3, default: 'MXN' })
  currency: string;

  @Column({ type: 'longtext', nullable: true })
  xml_unsigned: string | null;

  @Column({ type: 'longtext', nullable: true })
  xml_stamped: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  xml_stamped_s3_key: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  pdf_stamped_s3_key: string | null;

  @Column({ type: 'timestamp', nullable: true })
  stamped_at: Date | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  certificate_serial: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  sat_seal: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  sat_certificate_number: string | null;

  @Column({
    type: 'enum',
    enum: [
      'pending_stamp',
      'stamped',
      'stamp_error',
      'cancel_pending',
      'cancelled',
      'cancel_error',
    ],
    default: 'pending_stamp',
  })
  stamp_status: ElectronicInvoiceStampStatus;

  @Column({ type: 'text', nullable: true })
  stamp_error_message: string | null;

  @Column({ type: 'varchar', length: 2, nullable: true })
  cancel_motivo: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  cancel_replacement_uuid: string | null;

  @Column({ type: 'longtext', nullable: true })
  cancel_acuse_xml: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  cancel_sat_status_code: string | null;

  @Column({
    type: 'enum',
    enum: ['Vigente', 'Cancelado', 'No Encontrado', 'Desconocido'],
    nullable: true,
  })
  sat_status: ElectronicInvoiceSatStatus;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sat_es_cancelable: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sat_estatus_cancelacion: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  sat_codigo_estatus: string | null;

  @Column({ type: 'timestamp', nullable: true })
  sat_last_sync_at: Date | null;

  @Column({ type: 'tinyint', default: 1 })
  sat_sync_enabled: number;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, unknown> | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @Column({ type: 'varchar', length: 36, nullable: true })
  created_by: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
