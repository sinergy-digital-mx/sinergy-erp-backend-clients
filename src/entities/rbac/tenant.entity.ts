// src/entities/rbac/tenant.entity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';
import { IsNotEmpty, IsString, Length, IsOptional } from 'class-validator';

@Entity('rbac_tenants')
@Index('name_index', ['name'])
@Index('subdomain_index', ['subdomain'])
export class RBACTenant {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    @IsNotEmpty()
    @IsString()
    @Length(1, 100)
    name: string;

    @Column({ unique: true })
    @IsNotEmpty()
    @IsString()
    @Length(1, 50)
    subdomain: string;

    @Column({ nullable: true })
    @IsString()
    @IsOptional()
    legacy_tenant_id?: string;

    @Column({ default: true })
    is_active: boolean;

    @OneToMany('Role', 'tenant')
    roles: any[];

    @OneToMany('UserRole', 'tenant')
    user_roles: any[];

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}