import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { RBACTenant } from '../rbac/tenant.entity';
import { User } from '../users/user.entity';
import { PosConfiguration } from '../billing/pos-configuration.entity';

export enum PosSessionStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  SUSPENDED = 'suspended',
}

@Entity('pos_sessions')
export class PosSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36 })
  tenant_id: string;

  @Column({ type: 'varchar', length: 36 })
  pos_configuration_id: string;

  @Column({ type: 'varchar', length: 36 })
  user_id: string;

  @Column({ type: 'int' })
  session_number: number;

  // Session timing
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  opened_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  closed_at: Date;

  // Cash management
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  opening_cash: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  closing_cash: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  expected_cash: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cash_difference: number;

  // Session status
  @Column({
    type: 'enum',
    enum: PosSessionStatus,
    default: PosSessionStatus.OPEN,
  })
  status: PosSessionStatus;

  // Additional tracking
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total_sales: number;

  @Column({ type: 'int', default: 0 })
  total_transactions: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  closed_by: string;

  // Audit fields
  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => RBACTenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @ManyToOne(() => PosConfiguration)
  @JoinColumn({ name: 'pos_configuration_id' })
  posConfiguration: PosConfiguration;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'closed_by' })
  closedByUser: User;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv4();
    }
  }
}
