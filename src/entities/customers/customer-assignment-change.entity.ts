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
import { Customer } from './customer.entity';

export type AssignmentChangeItem = {
  field: string;
  field_label: string;
  from: string | null;
  to: string | null;
  from_id?: string | null;
  to_id?: string | null;
};

@Entity('customer_assignment_changes')
@Index('idx_customer_assignment_tenant', ['tenant_id'])
@Index('idx_customer_assignment_customer', ['customer_id'])
@Index('idx_customer_assignment_occurred', ['customer_id', 'occurred_at'])
export class CustomerAssignmentChange {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column({ length: 36 })
  tenant_id: string;

  @ManyToOne(() => Customer, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ type: 'int' })
  customer_id: number;

  @Column({ length: 50 })
  type: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'actor_id' })
  actor: User | null;

  @Column({ length: 36, nullable: true })
  actor_id: string | null;

  @Column({ type: 'timestamp' })
  occurred_at: Date;

  @Column({ type: 'json', nullable: true })
  changes: AssignmentChangeItem[] | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
