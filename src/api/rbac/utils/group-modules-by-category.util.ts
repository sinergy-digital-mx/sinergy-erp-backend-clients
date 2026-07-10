import {
  getModuleCategoryLabel,
  getModuleCategorySortOrder,
  DEFAULT_MODULE_CATEGORY,
} from '../constants/module-categories.constants';

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

export function buildGroupedModulesForPermissions(
  enabledModules: Array<{ module: ModuleLike }>,
  tenantPermissions: PermissionLike[],
  assignedPermissionIds?: Set<string>,
): GroupedModuleItem[] {
  return enabledModules.reduce((acc, tenantModule) => {
    const module = tenantModule.module;
    const modulePermissions = tenantPermissions.filter((p) => p.module_id === module.id);

    if (modulePermissions.length > 0) {
      const category = module.category ?? DEFAULT_MODULE_CATEGORY;
      acc.push({
        id: module.id,
        name: module.name,
        code: module.code,
        category,
        category_label: getModuleCategoryLabel(category),
        sort_order: module.sort_order ?? 0,
        permissions: modulePermissions
          .map((p) => ({
            id: p.id,
            entity: p.entity_type,
            action: p.action,
            description: p.description,
            ...(assignedPermissionIds
              ? { assigned: assignedPermissionIds.has(p.id) }
              : {}),
          }))
          .sort((a, b) => {
            const entityCompare = a.entity.localeCompare(b.entity);
            return entityCompare !== 0 ? entityCompare : a.action.localeCompare(b.action);
          }),
      });
    }

    return acc;
  }, [] as GroupedModuleItem[]);
}

export function groupModulesByCategory(modules: GroupedModuleItem[]): {
  modules: GroupedModuleItem[];
  categories: ModuleCategoryGroup[];
} {
  const sortedModules = [...modules].sort((a, b) => {
    const catCompare =
      getModuleCategorySortOrder(a.category) - getModuleCategorySortOrder(b.category);
    if (catCompare !== 0) {
      return catCompare;
    }
    if (a.sort_order !== b.sort_order) {
      return a.sort_order - b.sort_order;
    }
    return a.name.localeCompare(b.name);
  });

  const categoryMap = new Map<string, ModuleCategoryGroup>();

  for (const mod of sortedModules) {
    const categoryCode = mod.category || DEFAULT_MODULE_CATEGORY;
    if (!categoryMap.has(categoryCode)) {
      categoryMap.set(categoryCode, {
        code: categoryCode,
        label: getModuleCategoryLabel(categoryCode),
        sort_order: getModuleCategorySortOrder(categoryCode),
        modules: [],
      });
    }
    categoryMap.get(categoryCode)!.modules.push(mod);
  }

  const categories = Array.from(categoryMap.values()).sort(
    (a, b) => a.sort_order - b.sort_order,
  );

  return { modules: sortedModules, categories };
}
