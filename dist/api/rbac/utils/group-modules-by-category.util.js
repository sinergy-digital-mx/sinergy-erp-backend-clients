"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildGroupedModulesForPermissions = buildGroupedModulesForPermissions;
exports.groupModulesByCategory = groupModulesByCategory;
const module_categories_constants_1 = require("../constants/module-categories.constants");
function buildGroupedModulesForPermissions(enabledModules, tenantPermissions, assignedPermissionIds) {
    return enabledModules.reduce((acc, tenantModule) => {
        const module = tenantModule.module;
        const modulePermissions = tenantPermissions.filter((p) => p.module_id === module.id);
        if (modulePermissions.length > 0) {
            const category = module.category ?? module_categories_constants_1.DEFAULT_MODULE_CATEGORY;
            acc.push({
                id: module.id,
                name: module.name,
                code: module.code,
                category,
                category_label: (0, module_categories_constants_1.getModuleCategoryLabel)(category),
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
    }, []);
}
function groupModulesByCategory(modules) {
    const sortedModules = [...modules].sort((a, b) => {
        const catCompare = (0, module_categories_constants_1.getModuleCategorySortOrder)(a.category) - (0, module_categories_constants_1.getModuleCategorySortOrder)(b.category);
        if (catCompare !== 0) {
            return catCompare;
        }
        if (a.sort_order !== b.sort_order) {
            return a.sort_order - b.sort_order;
        }
        return a.name.localeCompare(b.name);
    });
    const categoryMap = new Map();
    for (const mod of sortedModules) {
        const categoryCode = mod.category || module_categories_constants_1.DEFAULT_MODULE_CATEGORY;
        if (!categoryMap.has(categoryCode)) {
            categoryMap.set(categoryCode, {
                code: categoryCode,
                label: (0, module_categories_constants_1.getModuleCategoryLabel)(categoryCode),
                sort_order: (0, module_categories_constants_1.getModuleCategorySortOrder)(categoryCode),
                modules: [],
            });
        }
        categoryMap.get(categoryCode).modules.push(mod);
    }
    const categories = Array.from(categoryMap.values()).sort((a, b) => a.sort_order - b.sort_order);
    return { modules: sortedModules, categories };
}
//# sourceMappingURL=group-modules-by-category.util.js.map