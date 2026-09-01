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
import { User } from '../users/user.entity';
import { Warehouse } from '../warehouse/warehouse.entity';

@Entity('user_warehouse_assignments')
@Index('idx_uwa_tenant', ['tenant_id'])
@Index('idx_uwa_user', ['tenant_id', 'user_id'])
@Index('uq_uwa_user_warehouse', ['tenant_id', 'user_id', 'warehouse_id'], {
  unique: true,
})
export class UserWarehouseAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  user_id: string;

  @ManyToOne(() => Warehouse, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;

  @Column()
  warehouse_id: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
