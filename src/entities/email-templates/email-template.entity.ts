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

export type EmailTemplateVariableType = 'string' | 'number' | 'date' | 'currency' | 'boolean';

export interface EmailTemplateCustomVariable {
  key: string;
  label: string;
  type: EmailTemplateVariableType;
  required?: boolean;
  defaultValue?: string | number | boolean | null;
}

@Entity('email_templates')
@Index('idx_email_templates_tenant_active', ['tenant_id', 'is_active'])
@Index('idx_email_templates_tenant_name', ['tenant_id', 'name'])
export class EmailTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  @Column({ length: 150 })
  name: string;

  @Column({ length: 255 })
  subject: string;

  @Column({ type: 'longtext' })
  body_html: string;

  @Column({ type: 'json', nullable: true })
  variables: string[] | null;

  @Column({ type: 'json', nullable: true })
  custom_variables: EmailTemplateCustomVariable[] | null;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'varchar', length: 36, nullable: true })
  created_by: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  updated_by: string | null;

  @Column({ type: 'timestamp', nullable: true })
  deleted_at: Date | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  deleted_by: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
