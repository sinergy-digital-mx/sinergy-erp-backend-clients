export declare const MODULE_CATEGORY_META: Record<string, {
    label: string;
    sort_order: number;
}>;
export declare const DEFAULT_MODULE_CATEGORY = "operations";
export declare function getModuleCategoryLabel(category: string | null | undefined): string;
export declare function getModuleCategorySortOrder(category: string | null | undefined): number;
