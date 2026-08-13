import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { BillingBranch } from './billing-branch.entity';

@Entity('fiscal_configurations')
@Index('tenant_index', ['tenant_id'])
export class FiscalConfiguration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @IsNotEmpty()
  tenant_id: string;

  @Column()
  @IsNotEmpty()
  @IsString()
  razon_social: string;

  @Column()
  @IsNotEmpty()
  @IsString()
  rfc: string;

  /** Prefijo para lotes de recepción OC: `{razon}-{sucursal}-{almacen}-{numero}` */
  @Column({ type: 'varchar', length: 10, nullable: true })
  @IsOptional()
  @IsString()
  prefix: string | null;

  @Column({
    type: 'enum',
    enum: ['Persona Física', 'Persona Moral'],
  })
  @IsNotEmpty()
  @IsString()
  persona_type: string;

  @Column({
    type: 'enum',
    enum: ['601', '603', '605', '606', '607', '608', '609', '610', '611', '614', '616', '620', '621', '622', '623', '624', '625', '626', '627', '628', '629', '630'],
    nullable: true,
  })
  @IsOptional()
  @IsString()
  fiscal_regime: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  digital_seal: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  digital_seal_password: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  private_key: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  @IsOptional()
  @IsString()
  logo: string;

  @Column({
    type: 'enum',
    enum: ['active', 'inactive'],
    default: 'active',
  })
  status: string;

  /** Usuario interno que registró la razón emisora */
  @Column({ type: 'varchar', length: 36, nullable: true })
  created_by: string | null;

  /** Número de certificado CSD (NoCertificado) usado en Finkok */
  @Column({ type: 'varchar', length: 30, nullable: true })
  certificate_serial_number: string | null;

  @Column({
    type: 'enum',
    enum: ['pending', 'registered', 'failed', 'not_required'],
    default: 'pending',
  })
  finkok_registration_status: string;

  @Column({ type: 'timestamp', nullable: true })
  finkok_registered_at: Date | null;

  @Column({ type: 'text', nullable: true })
  finkok_registration_error: string | null;

  /** Status remoto en Finkok (ej. A=activo) devuelto por Registration get */
  @Column({ type: 'varchar', length: 10, nullable: true })
  finkok_remote_status: string | null;

  @Column({ type: 'int', nullable: true })
  finkok_stamps_counter: number | null;

  @Column({ type: 'int', nullable: true })
  finkok_stamps_credit: number | null;

  @Column({ type: 'timestamp', nullable: true })
  last_finkok_sync_at: Date | null;

  @OneToMany(() => BillingBranch, (branch) => branch.fiscal_configuration)
  branches: BillingBranch[];

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
