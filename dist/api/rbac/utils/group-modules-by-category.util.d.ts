export interface ModulePermissionItem {
    id: string;
    entity: string;
    action: string;
    description?: string | null;
    assigned?: boolean;
}
export interface GroupedModuleItem {
    id: string;
    name: string;
    code: string;
    category: string;
    category_label: string;
    sort_order: number;
    permissions: ModulePermissionItem[];
}
export interface ModuleCategoryGroup {
    code: string;
    label: string;
    sort_order: number;
    modules: GroupedModuleItem[];
}
interface ModuleLike {
    id: string;
    name: string;
    code: string;
    category?: string | null;
    sort_order?: number;
}
interface PermissionLike {
    id: string;
    module_id?: string | null;
    entity_type: string;
    action: string;
    description?: string | null;
}
export declare function buildGroupedModulesForPermissions(enabledModules: Array<{
    module: ModuleLike;
}>, tenantPermissions: PermissionLike[], assignedPermissionIds?: Set<string>): GroupedModuleItem[];
export declare function groupModulesByCategory(modules: GroupedModuleItem[]): {
    modules: GroupedModuleItem[];
    categories: ModuleCategoryGroup[];
};
export {};
