import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { IsNotEmpty, IsString, Length, IsOptional } from 'class-validator';

@Entity('modules')
@Index('code_index', ['code'], { unique: true })
export class Module {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @IsNotEmpty()
  @IsString()
  @Length(1, 100)
  name: string;

  @Column({ unique: true })
  @IsNotEmpty()
  @IsString()
  @Length(1, 50)
  code: string;

  @Column({ nullable: true })
  @IsString()
  @Length(0, 255)
  @IsOptional()
  description: string;

  /** Agrupa el módulo en la UI de roles/permisos (sales, catalogs, finance, etc.) */
  @Column({ type: 'varchar', length: 50, nullable: true })
  @IsOptional()
  @IsString()
  category: string | null;

  /** Orden dentro de su categoría */
  @Column({ type: 'int', default: 0 })
  sort_order: number;

  @OneToMany('Permission', 'module')
  permissions: any[];

  @OneToMany('TenantModule', 'module')
  tenant_modules: any[];

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
