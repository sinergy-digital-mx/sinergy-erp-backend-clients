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

export enum GlobalDiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

@Entity('global_discounts')
@Index('global_discount_tenant_index', ['tenant_id'])
@Index('UQ_global_discounts_tenant_name', ['tenant_id', 'name'], { unique: true })
export class GlobalDiscount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  @Column({ length: 120 })
  name: string;

  @Column({
    type: 'enum',
    enum: GlobalDiscountType,
    default: GlobalDiscountType.PERCENTAGE,
  })
  discount_type: GlobalDiscountType;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  value: number;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'date', nullable: true })
  valid_from: Date | null;

  @Column({ type: 'date', nullable: true })
  valid_to: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
