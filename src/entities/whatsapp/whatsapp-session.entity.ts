import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RBACTenant } from '../rbac/tenant.entity';

@Entity('whatsapp_sessions')
@Index('uq_whatsapp_sessions_tenant', ['tenant_id'], { unique: true })
@Index('uq_whatsapp_sessions_name', ['session_name'], { unique: true })
export class WhatsappSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column({ type: 'varchar', length: 36 })
  tenant_id: string;

  @Column({ type: 'varchar', length: 80 })
  session_name: string;

  @Column({ type: 'varchar', length: 32, default: 'STOPPED' })
  status: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  phone_number: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  push_name: string | null;

  @Column({ type: 'timestamp', nullable: true })
  connected_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  last_status_at: Date | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  last_error: string | null;

  @Column({ type: 'varchar', length: 36 })
  created_by: string;

  @Column({ type: 'varchar', length: 36 })
  updated_by: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
