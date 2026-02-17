// src/entities/rbac/role.entity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';
import { IsNotEmpty, IsString, Length, IsBoolean, IsOptional } from 'class-validator';

@Entity('rbac_roles')
@Index('tenant_name_index', ['tenant_id', 'name'], { unique: true })
@Index('tenant_index', ['tenant_id'])
@Index('name_index', ['name'])
export class Role {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @IsNotEmpty()
    @IsString()
    @Length(1, 100)
    name: string;

    @Column({ nullable: true })
    @IsString()
    @Length(0, 255)
    @IsOptional()
    description: string;

    @Column({ default: false })
    @IsBoolean()
    is_system_role: boolean;

    @Column({ default: false })
    @IsBoolean()
    is_admin: boolean;

    @ManyToOne('RBACTenant', 'roles', { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'tenant_id' })
    tenant: any;

    @Column({ name: 'tenant_id' })
    tenant_id: string;

    @OneToMany('UserRole', 'role')
    user_roles: any[];

    @OneToMany('RolePermission', 'role')
    role_permissions: any[];

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updated_at: Date;
}