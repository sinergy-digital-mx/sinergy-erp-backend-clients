import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

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
