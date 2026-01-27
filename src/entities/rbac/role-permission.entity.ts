// src/entities/rbac/role-permission.entity.ts
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

@Entity('rbac_role_permissions')
@Index('role_permission_index', ['role_id', 'permission_id'], { unique: true })
@Index('role_index', ['role_id'])
@Index('permission_index', ['permission_id'])
export class RolePermission {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne('Role', 'role_permissions', { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'role_id' })
    role: any;

    @Column({ name: 'role_id' })
    @IsUUID()
    role_id: string;

    @ManyToOne('Permission', 'role_permissions', { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'permission_id' })
    permission: any;

    @Column({ name: 'permission_id' })
    @IsUUID()
    permission_id: string;

    @CreateDateColumn()
    created_at: Date;
}