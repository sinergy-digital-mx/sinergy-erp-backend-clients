// src/entities/rbac/user-role.entity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    Index,
} from 'typeorm';
import { IsUUID } from 'class-validator';

@Entity('rbac_user_roles')
@Index('user_role_tenant_index', ['user_id', 'role_id', 'tenant_id'], { unique: true })
@Index('user_tenant_index', ['user_id', 'tenant_id'])
@Index('role_index', ['role_id'])
@Index('tenant_index', ['tenant_id'])
export class UserRole {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne('User', { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: any;

    @Column({ name: 'user_id' })
    @IsUUID()
    user_id: string;

    @ManyToOne('Role', 'user_roles', { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'role_id' })
    role: any;

    @Column({ name: 'role_id' })
    @IsUUID()
    role_id: string;

    @ManyToOne('RBACTenant', 'user_roles', { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'tenant_id' })
    tenant: any;

    @Column({ name: 'tenant_id' })
    @IsUUID()
    tenant_id: string;

    @CreateDateColumn()
    created_at: Date;
}