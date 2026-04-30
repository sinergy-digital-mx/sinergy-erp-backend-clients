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
import { IsNotEmpty, IsString, IsOptional, IsUUID, IsIn } from 'class-validator';
import { BillingBranch } from './billing-branch.entity';

@Entity('pos_configurations')
@Index('tenant_index', ['tenant_id'])
@Index('branch_index', ['sucursal'])
export class PosConfiguration {
  static readonly ALLOWED_TYPES = ['VENTAS', 'COBRANZA'] as const;

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @IsNotEmpty()
  tenant_id: string;

  @Column({ length: 255 })
  @IsNotEmpty()
  @IsString()
  code: string;

  @Column({ type: 'varchar', length: 20 })
  @IsNotEmpty()
  @IsString()
  @IsIn(PosConfiguration.ALLOWED_TYPES)
  type: (typeof PosConfiguration.ALLOWED_TYPES)[number];

  @Column({ name: 'sucursal' })
  @IsNotEmpty()
  @IsUUID()
  sucursal: string;

  @Column({ length: 255, nullable: true })
  @IsOptional()
  @IsString()
  modelo?: string;

  @Column({ type: 'tinyint', default: 1 })
  @IsIn([0, 1])
  status: number;

  @ManyToOne(() => BillingBranch, { eager: true })
  @JoinColumn({ name: 'sucursal' })
  branch: BillingBranch;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}