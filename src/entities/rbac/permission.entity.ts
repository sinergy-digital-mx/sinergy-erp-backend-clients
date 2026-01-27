// src/entities/rbac/permission.entity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';
import { IsNotEmpty, IsString, Length, IsBoolean, IsOptional } from 'class-validator';

@Entity('rbac_permissions')
@Index('entity_action_index', ['entity_type', 'action'], { unique: true })
@Index('entity_type_index', ['entity_type'])
@Index('action_index', ['action'])
export class Permission {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @IsNotEmpty()
    @IsString()
    @Length(1, 100)
    entity_type: string;

    @Column()
    @IsNotEmpty()
    @IsString()
    @Length(1, 50)
    action: string;

    @Column({ nullable: true })
    @IsString()
    @Length(0, 255)
    @IsOptional()
    description: string;

    @Column({ default: false })
    @IsBoolean()
    is_system_permission: boolean;

    @OneToMany('RolePermission', 'permission')
    role_permissions: any[];

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updated_at: Date;
}