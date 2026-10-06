export type InventoryPedimentoEntry = {
    number: string | null;
    date: string | null;
    customs: string | null;
    vendor: string | null;
    raw: string;
};
export type InventoryExcelRow = {
    row_number: number;
    sku: string;
    name: string;
    alternate_sku: string | null;
    sat_clave: string | null;
    pedimentos: InventoryPedimentoEntry[];
    price: number | null;
    cost: number | null;
    quantity: number | null;
};
export declare function normalizeSatClave(value: unknown): string | null;
export declare function parsePedimentoCell(value: unknown): InventoryPedimentoEntry[];
export declare function selectPrimaryPedimento(entries: InventoryPedimentoEntry[]): InventoryPedimentoEntry | null;
export declare function parseMadereriaInventoryExcel(buffer: Buffer): InventoryExcelRow[];
