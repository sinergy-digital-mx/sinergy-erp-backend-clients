export type VendorImportKind = 'cost' | 'price';
export interface VendorImportTemplateColumn {
    header: string;
    key: string;
    width: number;
    type?: 'text' | 'currency' | 'unit_cost';
    hidden?: boolean;
    editable?: boolean;
}
export interface VendorImportTemplateRow {
    sku: string;
    name: string;
    uom: string;
    currency?: string;
    price_list?: string;
    is_active?: string;
    current_value: number | null;
    new_value: number | null;
    _id: string;
    _product_id: string;
    _product_uom_id: string;
    _price_list_id?: string;
}
export interface ParsedVendorImportRow {
    row_number: number;
    sku: string;
    uom: string;
    new_value: number | null;
    id: string | null;
    product_id: string | null;
    product_uom_id: string | null;
    price_list_id: string | null;
}
export declare const COST_TEMPLATE_HEADERS: {
    readonly sku: "SKU";
    readonly name: "Nombre";
    readonly uom: "UOM";
    readonly currency: "Moneda";
    readonly is_active: "Activo";
    readonly current_value: "Costo actual";
    readonly new_value: "Nuevo costo";
    readonly _id: "_id";
    readonly _product_id: "_product_id";
    readonly _product_uom_id: "_product_uom_id";
};
export declare const PRICE_TEMPLATE_HEADERS: {
    readonly sku: "SKU";
    readonly name: "Nombre";
    readonly uom: "UOM";
    readonly price_list: "Lista de precios";
    readonly is_active: "Activo";
    readonly current_value: "Precio actual";
    readonly new_value: "Nuevo precio";
    readonly _id: "_id";
    readonly _product_id: "_product_id";
    readonly _product_uom_id: "_product_uom_id";
    readonly _price_list_id: "_price_list_id";
};
export declare function vendorImportFilename(kind: VendorImportKind, vendorName: string, extra?: string): string;
export declare function parseMoney(value: unknown): number | null;
export declare function buildVendorImportTemplate(options: {
    kind: VendorImportKind;
    title: string;
    subtitle: string;
    contextLines: string[];
    rows: VendorImportTemplateRow[];
}): Promise<Buffer>;
export declare function parseVendorImportExcel(buffer: Buffer, kind: VendorImportKind): ParsedVendorImportRow[];
