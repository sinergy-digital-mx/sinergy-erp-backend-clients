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
import { Warehouse } from '../warehouse/warehouse.entity';

@Entity('pos_tables')
@Index('pos_tables_tenant_idx', ['tenant_id'])
@Index('pos_tables_warehouse_idx', ['warehouse_id'])
@Index('pos_tables_status_idx', ['status'])
@Index('pos_tables_unique_idx', ['tenant_id', 'warehouse_id', 'table_number'], { unique: true })
export class POSTable {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  @ManyToOne(() => Warehouse, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;

  @Column()
  warehouse_id: string;

  @Column()
  table_number: string;

  @Column({ nullable: true })
  zone: string;

  @Column({ type: 'int', default: 4 })
  capacity: number;

  @Column({
    type: 'enum',
    enum: ['available', 'occupied', 'reserved', 'cleaning'],
    default: 'available',
  })
  status: string;

  @Column({ type: 'uuid', nullable: true })
  current_order_id: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
