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
import { Property } from '../properties/property.entity';
import { FiscalConfiguration } from '../billing/fiscal-configuration.entity';
import { User } from '../users/user.entity';

/**
 * Formato de reservación Divino.
 * Es una cotización/apartado de un LOTE (no una venta real). El LOTE se
 * selecciona del sistema (Property) y el resto de los datos del formato
 * son capturados manualmente replicando el formato en papel.
 */
@Entity('divino_reservation_formats')
@Index('tenant_index', ['tenant_id'])
@Index('property_index', ['property_id'])
@Index('status_index', ['status'])
@Index('folio_index', ['tenant_id', 'folio'], { unique: true })
export class DivinoReservationFormat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  /** Folio interno del formato (búsqueda / listado). */
  @Column({ length: 50 })
  folio: string;

  // --- Encabezado / Razón social (logo dinámico) ---

  @ManyToOne(() => FiscalConfiguration, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'fiscal_configuration_id' })
  fiscal_configuration: FiscalConfiguration | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  fiscal_configuration_id: string | null;

  /** Snapshot de la razón social mostrada en el PDF (pagadero a). */
  @Column({ type: 'varchar', length: 255, nullable: true })
  payable_to: string | null;

  // --- Recepción de fondos ---

  /** "Recibido de" */
  @Column({ type: 'varchar', length: 255, nullable: true })
  received_from: string | null;

  /** "la suma de" (cantidad con letra) */
  @Column({ type: 'varchar', length: 255, nullable: true })
  amount_in_words: string | null;

  /** "Evidenciado por" (forma/medio de pago) */
  @Column({ type: 'varchar', length: 255, nullable: true })
  evidenced_by: string | null;

  // --- LOTE (seleccionado del sistema) ---

  @ManyToOne(() => Property, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'property_id' })
  property: Property;

  @Column()
  property_id: string;

  /** Snapshot: Manzana */
  @Column({ type: 'varchar', length: 50, nullable: true })
  block: string | null;

  /** Snapshot: Número de Lote */
  @Column({ type: 'varchar', length: 50, nullable: true })
  lot_number: string | null;

  /** Snapshot: Superficie */
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  surface: number | null;

  /** Precio de compra */
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  purchase_price: number | null;

  @Column({ length: 10, default: 'USD' })
  currency: string;

  // --- Plan de pagos ---

  /** Depósito de reserva */
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  reservation_deposit: number | null;

  /** Fecha de reserva */
  @Column({ type: 'date', nullable: true })
  reservation_date: Date | null;

  /** Enganche */
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  down_payment: number | null;

  /** Fecha de pago de enganche */
  @Column({ type: 'date', nullable: true })
  down_payment_date: Date | null;

  /** Saldo a financiar */
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  financed_balance: number | null;

  /** Años de financiamiento */
  @Column({ type: 'int', nullable: true })
  financing_years: number | null;

  /** Número de pagos mensuales */
  @Column({ type: 'int', nullable: true })
  monthly_payments_count: number | null;

  /** Monto de pago mensual */
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  monthly_payment_amount: number | null;

  /** Cuota de mantenimiento (por defecto 50 USD mensuales) */
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 50 })
  maintenance_fee: number;

  @Column({ length: 10, default: 'USD' })
  maintenance_currency: string;

  /** Día de pago: 1ro del mes o 15 del mes */
  @Column({
    type: 'enum',
    enum: ['1', '15'],
    nullable: true,
  })
  payment_day: string | null;

  // --- Datos del comprador ---

  @Column({ type: 'varchar', length: 255, nullable: true })
  buyer_name: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  buyer_address: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  buyer_phone: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  buyer_email: string | null;

  // --- Cómo se enteró del proyecto ---

  @Column({
    type: 'enum',
    enum: [
      'facebook',
      'instagram',
      'google',
      'restaurante',
      'walkin',
      'referido',
      'otro',
    ],
    nullable: true,
  })
  lead_source: string | null;

  /** Texto libre cuando lead_source = 'otro' */
  @Column({ type: 'varchar', length: 255, nullable: true })
  lead_source_other: string | null;

  // --- Pie del formato ---

  /** Fecha del formato */
  @Column({ type: 'date', nullable: true })
  format_date: Date | null;

  /** Agente */
  @Column({ type: 'varchar', length: 255, nullable: true })
  agent_name: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({
    type: 'enum',
    enum: ['draft', 'sent'],
    default: 'draft',
  })
  status: string;

  // --- Auditoría de creación / envío ---

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: User | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  created_by: string | null;

  /** Snapshot del nombre de quien creó el formato. */
  @Column({ type: 'varchar', length: 255, nullable: true })
  created_by_name: string | null;

  @Column({ type: 'timestamp', nullable: true })
  sent_at: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  sent_to: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  sent_by: string | null;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
