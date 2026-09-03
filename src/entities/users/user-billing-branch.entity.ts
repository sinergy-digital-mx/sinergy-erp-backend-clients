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
import { User } from './user.entity';
import { BillingBranch } from '../billing/billing-branch.entity';

@Entity('user_billing_branches')
@Index('idx_user_billing_branches_tenant', ['tenant_id'])
@Index('idx_user_billing_branches_user', ['tenant_id', 'user_id'])
@Index('uq_user_billing_branch', ['user_id', 'billing_branch_id'], { unique: true })
export class UserBillingBranch {
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

  @ManyToOne(() => BillingBranch, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'billing_branch_id' })
  billing_branch: BillingBranch;

  @Column()
  billing_branch_id: string;

  @Column({ type: 'tinyint', default: 0 })
  is_primary: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
