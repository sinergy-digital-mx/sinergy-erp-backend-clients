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
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

@Entity('categories')
@Index('tenant_index', ['tenant_id'])
@Index('status_index', ['status'])
@Index('tenant_status_index', ['tenant_id', 'status'])
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @IsNotEmpty()
  tenant_id: string;

  @Column()
  @IsNotEmpty()
  @IsString()
  name: string;

  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  description: string;

  @Column({
    type: 'enum',
    enum: ['active', 'inactive'],
    default: 'active',
  })
  status: string;

  @Column({ nullable: true })
  @IsOptional()
  icon: string;

  @Column({ default: 0 })
  display_order: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
