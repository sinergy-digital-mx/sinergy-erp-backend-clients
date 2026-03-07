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

@Entity('vendors')
@Index('tenant_index', ['tenant_id'])
@Index('status_index', ['status'])
@Index('rfc_index', ['rfc'])
export class Vendor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  // Basic Information
  @Column()
  name: string;

  @Column({ nullable: true })
  company_name: string;

  // Address Information
  @Column({ nullable: true })
  street: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  zip_code: string;

  @Column({ nullable: true })
  country: string;

  // Mexican Billing Information
  @Column({ nullable: true })
  razon_social: string;

  @Column({ nullable: true })
  rfc: string;

  @Column({
    type: 'enum',
    enum: ['Persona Física', 'Persona Moral'],
    nullable: true,
  })
  persona_type: string;

  // Status
  @Column({
    type: 'enum',
    enum: ['active', 'inactive'],
    default: 'active',
  })
  status: string;

  // Timestamps
  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
