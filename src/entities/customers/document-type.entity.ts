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

@Entity('document_types')
@Index('tenant_index', ['tenant_id'])
export class DocumentType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column({ nullable: true })
  tenant_id: string | null; // null = global/system type

  @Column({ length: 100 })
  code: string; // 'id_card', 'drivers_license', 'proof_of_income', etc.

  @Column({ length: 150 })
  name: string; // 'INE/IFE', 'Licencia de Conducir', 'Recibo de Nómina'

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  is_required: boolean; // Si es obligatorio para el tenant

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>; // Configuración adicional

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
