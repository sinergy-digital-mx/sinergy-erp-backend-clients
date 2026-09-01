import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { MeasurementUnit } from './measurement-unit.entity';
import { RBACTenant } from '../rbac/tenant.entity';
import { Contract } from '../contracts/contract.entity';
import { CustomerGroup } from '../customers/customer-group.entity';

@Entity('properties')
@Index('tenant_index', ['tenant_id'])
@Index('group_index', ['group_id'])
@Index('code_index', ['code', 'tenant_id'], { unique: true })
export class Property {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  /** Grupo de cliente (mismo catálogo que clientes y contratos). */
  @ManyToOne(() => CustomerGroup, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'group_id' })
  group: CustomerGroup;

  @Column()
  group_id: string;

  @Column({ length: 50 })
  code: string;

  @Column({ length: 50, nullable: true })
  block: string;

  @Column({ length: 50, nullable: true })
  lot_number: string;

  /** Clave catastral del lote (opcional). */
  @Column({ type: 'varchar', length: 100, nullable: true })
  cadastral_key: string | null;

  @Column({ length: 150 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 255, nullable: true })
  location: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total_area: number;

  @ManyToOne(() => MeasurementUnit, (unit) => unit.properties, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'measurement_unit_id' })
  measurement_unit: MeasurementUnit;

  @Column()
  measurement_unit_id: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  total_price: number;

  /** Precio por m². Opcional en alta; si se envía, el total se calcula. */
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  price_per_m2: number | null;

  /** Precio de lista publicado (vs precio de cierre en contrato). */
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  list_price: number | null;

  @Column({ length: 10, default: 'USD' })
  currency: string;

  @Column({
    type: 'enum',
    enum: ['disponible', 'vendido', 'reservado', 'cancelado'],
    default: 'disponible',
  })
  status: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @OneToMany(() => Contract, contract => contract.property)
  contracts: Contract[];

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
