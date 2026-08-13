import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FiscalConfiguration } from './fiscal-configuration.entity';

@Entity('billing_branches')
export class BillingBranch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'fiscal_configuration_id' })
  fiscal_configuration_id: string;

  @ManyToOne(() => FiscalConfiguration, (config) => config.branches, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'fiscal_configuration_id' })
  fiscal_configuration: FiscalConfiguration;

  @Column({ length: 255 })
  code: string;

  /** Prefijo para lotes de recepción OC (ej. SBA). Distinto del nombre en `code`. */
  @Column({ type: 'varchar', length: 10, nullable: true })
  prefix: string | null;

  @Column({ length: 255 })
  address: string;

  @Column({ length: 255 })
  city: string;

  @Column({ length: 255 })
  state: string;

  @Column({ length: 255 })
  country: string;

  @Column({ length: 20 })
  postal_code: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  latitude: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  longitude: number | null;

  @Column({ type: 'tinyint', default: 1 })
  status: number;

  @OneToMany('Warehouse', 'billing_branch')
  warehouses: any[];

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
