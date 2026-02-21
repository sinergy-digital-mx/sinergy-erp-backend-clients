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
import { Contract } from './contract.entity';
import { RBACTenant } from '../rbac/tenant.entity';

@Entity('contract_documents')
@Index('tenant_index', ['tenant_id'])
@Index('contract_index', ['contract_id'])
export class ContractDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  @ManyToOne(() => Contract, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'contract_id' })
  contract: Contract;

  @Column()
  contract_id: string;

  @Column({ length: 255 })
  file_name: string; // Original filename

  @Column({ length: 500 })
  s3_key: string; // S3 path: {tenant_id}/contracts/{contract_id}/{uuid}-{filename}

  @Column({ length: 100 })
  mime_type: string; // application/pdf, image/jpeg, etc.

  @Column({ type: 'bigint' })
  file_size: number; // bytes

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  })
  status: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>; // Info adicional

  @Column({ nullable: true })
  uploaded_by: string; // User ID que subió el documento

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
