export interface ExcelColumnDef {
    header: string;
    key: string;
    width?: number;
    type?: 'text' | 'number' | 'currency' | 'unit_cost' | 'date' | 'integer' | 'percent';
}
export interface BuildExcelOptions {
    sheetName: string;
    title: string;
    subtitle?: string;
    columns: ExcelColumnDef[];
    rows: Record<string, unknown>[];
    headerColor?: string;
    titleColor?: string;
}
export declare function buildStyledExcelBuffer(options: BuildExcelOptions): Promise<Buffer>;
export declare function formatExportDate(value: Date | string | null | undefined): string;
export declare function formatExportDateTime(value: Date | string | null | undefined): string;
export declare function num(value: unknown): number;
export declare function buildExportSubtitle(parts: string[]): string;
export declare function validateDateRange(from: string, to: string): void;
