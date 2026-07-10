/** Categorías de módulos para agrupar permisos en UI (Roles, menú admin, etc.) */
export const MODULE_CATEGORY_META: Record<
  string,
  { label: string; sort_order: number }
> = {
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

export const DEFAULT_MODULE_CATEGORY = 'operations';

export function getModuleCategoryLabel(category: string | null | undefined): string {
  if (!category) {
    return MODULE_CATEGORY_META[DEFAULT_MODULE_CATEGORY].label;
  }
  return MODULE_CATEGORY_META[category]?.label ?? category;
}

export function getModuleCategorySortOrder(category: string | null | undefined): number {
  if (!category) {
    return MODULE_CATEGORY_META[DEFAULT_MODULE_CATEGORY].sort_order;
  }
  return MODULE_CATEGORY_META[category]?.sort_order ?? 99;
}
