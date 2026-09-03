"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_MODULE_CATEGORY = exports.MODULE_CATEGORY_META = void 0;
exports.getModuleCategoryLabel = getModuleCategoryLabel;
exports.getModuleCategorySortOrder = getModuleCategorySortOrder;
exports.MODULE_CATEGORY_META = {
    sales: { label: 'Ventas', sort_order: 1 },
    purchases: { label: 'Compras', sort_order: 2 },
    catalogs: { label: 'Catálogos', sort_order: 3 },
    operations: { label: 'Operaciones', sort_order: 4 },
    crm: { label: 'CRM', sort_order: 5 },
    finance: { label: 'Finanzas', sort_order: 6 },
    real_estate: { label: 'Inmobiliario', sort_order: 7 },
    admin: { label: 'Administración', sort_order: 8 },
    settings: { label: 'Configuración', sort_order: 9 },
};
exports.DEFAULT_MODULE_CATEGORY = 'operations';
function getModuleCategoryLabel(category) {
    if (!category) {
        return exports.MODULE_CATEGORY_META[exports.DEFAULT_MODULE_CATEGORY].label;
    }
    return exports.MODULE_CATEGORY_META[category]?.label ?? category;
}
function getModuleCategorySortOrder(category) {
    if (!category) {
        return exports.MODULE_CATEGORY_META[exports.DEFAULT_MODULE_CATEGORY].sort_order;
    }
    return exports.MODULE_CATEGORY_META[category]?.sort_order ?? 99;
}
//# sourceMappingURL=module-categories.constants.js.map