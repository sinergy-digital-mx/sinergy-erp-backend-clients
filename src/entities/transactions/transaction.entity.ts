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
import { EntityRegistry } from '../entity-registry/entity-registry.entity';

@Entity('transactions')
@Index(['tenant_id', 'entity_type_id', 'entity_id'])
@Index(['tenant_id', 'status'])
@Index(['entity_type_id', 'entity_id'])
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column({ name: 'tenant_id' })
  tenant_id: string;

  // Foreign key to EntityRegistry
  @ManyToOne(() => EntityRegistry, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'entity_type_id' })
  entityType: EntityRegistry;

  @Column()
  entity_type_id: number;

  // entity_id: UUID of the specific entity instance
  @Column()
  entity_id: string;

  // COMPUTED: Derived from entityType relationship
  get entity_type(): string | null {
    return this.entityType?.code || null;
  }

  @Column({ length: 50 })
  transaction_number: string;

  @Column({ type: 'date' })
  transaction_date: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ length: 50, default: 'transferencia' })
  payment_method: string;

  @Column({
    type: 'enum',
    enum: ['pagado', 'pendiente', 'atrasado', 'cancelado'],
    default: 'pendiente',
  })
  status: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
