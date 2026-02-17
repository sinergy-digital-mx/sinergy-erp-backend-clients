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

  @OneToMany('Permission', 'module')
  permissions: any[];

  @OneToMany('TenantModule', 'module')
  tenant_modules: any[];

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
