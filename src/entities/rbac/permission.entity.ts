// src/entities/rbac/permission.entity.ts
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
import { EntityRegistry } from '../entity-registry/entity-registry.entity';

@Entity('rbac_permissions')
@Index('module_action_index', ['module_id', 'action'], { unique: true })
@Index('action_index', ['action'])
@Index('module_index', ['module_id'])
@Index('entity_registry_index', ['entity_registry_id'])
export class Permission {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne('Module', 'permissions', { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'module_id' })
    module: any;

    @Column({ nullable: true })
    module_id: string;

    @ManyToOne(() => EntityRegistry, { onDelete: 'RESTRICT', nullable: false })
    @JoinColumn({ name: 'entity_registry_id' })
    entity_registry: EntityRegistry;

    @Column()
    entity_registry_id: number;

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

    /**
     * Computed property: Get entity_type from entity_registry
     * This ensures consistency - entity_type is always derived from the registry
     */
    get entity_type(): string {
        return this.entity_registry?.code || '';
    }
}
