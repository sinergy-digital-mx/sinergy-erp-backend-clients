import { CreatePropertyDto } from '../dto/create-property.dto';
export declare const PROPERTY_IMPORT_SHEET = "Lotes";
export declare const PROPERTY_IMPORT_MAX_ROWS = 500;
export declare const PROPERTY_IMPORT_EXAMPLE_CODE = "EJEMPLO";
export declare const PROPERTY_IMPORT_HEADERS: readonly ["codigo", "nombre", "grupo", "area", "unidad", "manzana", "numero_lote", "clave_catastral", "ubicacion", "descripcion", "precio_m2", "precio_total", "moneda", "estado"];
export interface PropertyImportRowError {
    row: number;
    message: string;
}
export interface PropertyImportCatalogs {
    groups: {
        id: string;
        name: string;
    }[];
    units: {
        id: string;
        code: string;
        name: string;
        symbol: string;
    }[];
    existingCodes: Set<string>;
}
interface RawImportRow {
    row: number;
    values: Record<string, unknown>;
}
export declare function foldText(value: string): string;
export declare function buildPropertyImportTemplate(catalogs: {
    groups: {
        name: string;
    }[];
    units: {
        code: string;
        name: string;
        symbol: string;
    }[];
}): Promise<Buffer>;
export declare function parsePropertyImportWorkbook(buffer: Buffer): {
    rows: RawImportRow[];
    errors: PropertyImportRowError[];
};
export declare function resolvePropertyImportRows(rows: RawImportRow[], catalogs: PropertyImportCatalogs, parseErrors?: PropertyImportRowError[]): {
    ready: CreatePropertyDto[];
    errors: PropertyImportRowError[];
};
export {};
