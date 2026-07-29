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

@Entity('trucks')
@Index('idx_trucks_tenant', ['tenant_id'])
@Index('idx_trucks_status', ['status'])
@Index('uq_trucks_tenant_placa', ['tenant_id', 'placa'], { unique: true })
export class Truck {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column({ type: 'varchar', length: 36 })
  tenant_id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  code: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  placa: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  anio: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  permiso_sct: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  numero_permiso_sct: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  tipo_auto_transporte: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  aseguradora_rc: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  poliza_rc: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  subtipo_remolque1: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  placa_remolque1: string | null;

  @Column({
    type: 'enum',
    enum: ['active', 'inactive'],
    default: 'active',
  })
  status: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
