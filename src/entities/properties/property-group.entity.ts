import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Property } from './property.entity';
import { RBACTenant } from '../rbac/tenant.entity';

@Entity('property_groups')
@Index('tenant_index', ['tenant_id'])
export class PropertyGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 50, nullable: true })
  location: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  total_area: number;

  @Column({ type: 'int', default: 0 })
  total_properties: number;

  @Column({ type: 'int', default: 0 })
  available_properties: number;

  @Column({ type: 'int', default: 0 })
  sold_properties: number;

  @OneToMany(() => Property, (property) => property.group)
  properties: Property[];

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
