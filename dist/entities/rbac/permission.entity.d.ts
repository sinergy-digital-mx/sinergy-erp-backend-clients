import { EntityRegistry } from '../entity-registry/entity-registry.entity';
export declare class Permission {
    id: string;
    module: any;
    module_id: string;
    entity_registry: EntityRegistry;
    entity_registry_id: number;
    action: string;
    description: string;
    is_system_permission: boolean;
    role_permissions: any[];
    created_at: Date;
    updated_at: Date;
    get entity_type(): string;
}
