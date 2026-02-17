import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { PropertyGroup } from './property-group.entity';
import { RBACTenant } from '../rbac/tenant.entity';

@Entity('properties')
@Index('tenant_index', ['tenant_id'])
@Index('group_index', ['group_id'])
@Index('code_index', ['code', 'tenant_id'], { unique: true })
export class Property {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  @ManyToOne(() => PropertyGroup, (group) => group.properties, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'group_id' })
  group: PropertyGroup;

  @Column()
  group_id: string;

  @Column({ length: 50 })
  code: string;

  @Column({ length: 150 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 255, nullable: true })
  location: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total_area: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  total_price: number;

  @Column({ length: 10, default: 'MXN' })
  currency: string;

  @Column({
    type: 'enum',
    enum: ['disponible', 'vendido', 'reservado', 'cancelado'],
    default: 'disponible',
  })
  status: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
