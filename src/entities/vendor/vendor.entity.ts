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
import { VendorType } from './vendor-type.enum';

@Entity('vendors')
@Index('tenant_index', ['tenant_id'])
@Index('status_index', ['status'])
@Index('rfc_index', ['rfc'])
@Index('vendor_type_index', ['vendor_type'])
export class Vendor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RBACTenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: RBACTenant;

  @Column()
  tenant_id: string;

  @Column({
    type: 'enum',
    enum: VendorType,
    default: VendorType.NATIONAL,
  })
  vendor_type: VendorType;

  @Column({ type: 'varchar', length: 32, nullable: true })
  vendor_code: string | null;

  @Column()
  name: string;

  @Column({ type: 'varchar', nullable: true })
  company_name: string | null;

  @Column({ type: 'varchar', nullable: true })
  street: string | null;

  @Column({ type: 'varchar', nullable: true })
  city: string | null;

  @Column({ type: 'varchar', nullable: true })
  state: string | null;

  @Column({ type: 'varchar', nullable: true })
  zip_code: string | null;

  @Column({ type: 'varchar', nullable: true })
  country: string | null;

  @Column({ type: 'varchar', nullable: true })
  razon_social: string | null;

  @Column({ type: 'varchar', nullable: true })
  rfc: string | null;

  @Column({
    type: 'enum',
    enum: ['Persona Física', 'Persona Moral'],
    nullable: true,
  })
  persona_type: string | null;

  @Column({ type: 'varchar', nullable: true })
  tax_id: string | null;

  @Column({ type: 'varchar', nullable: true })
  legal_name: string | null;

  @Column({ type: 'varchar', nullable: true })
  bank_name: string | null;

  @Column({ type: 'varchar', nullable: true })
  bank_account_holder: string | null;

  @Column({ type: 'varchar', nullable: true })
  bank_account_number: string | null;

  @Column({ type: 'varchar', length: 18, nullable: true })
  bank_clabe: string | null;

  @Column({ type: 'varchar', length: 11, nullable: true })
  bank_swift_bic: string | null;

  @Column({ type: 'varchar', length: 34, nullable: true })
  bank_iban: string | null;

  @Column({ type: 'varchar', length: 3, nullable: true })
  bank_currency: string | null;

  @Column({ type: 'integer', nullable: true })
  credit_days: number | null;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  credit_limit: string | null;

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
