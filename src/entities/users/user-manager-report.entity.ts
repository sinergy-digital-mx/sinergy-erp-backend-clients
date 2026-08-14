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

@Entity('user_manager_reports')
@Index('idx_user_manager_reports_tenant', ['tenant_id'])
@Index('idx_user_manager_reports_manager', ['tenant_id', 'manager_user_id'])
@Index('idx_user_manager_reports_report_unique', ['tenant_id', 'report_user_id'], {
  unique: true,
})
export class UserManagerReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'manager_user_id' })
  manager: User;

  @Column()
  manager_user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'report_user_id' })
  report: User;

  @Column()
  report_user_id: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
