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

@Entity('subcategories')
@Index('category_index', ['category_id'])
@Index('tenant_index', ['tenant_id'])
@Index('status_index', ['status'])
@Index('tenant_category_index', ['tenant_id', 'category_id'])
export class Subcategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @IsNotEmpty()
  tenant_id: string;

  @ManyToOne('Category', 'subcategories', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'category_id' })
  category: any;

  @Column()
  @IsNotEmpty()
  category_id: string;

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
