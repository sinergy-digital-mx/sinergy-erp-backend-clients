export type InventoryExcelRow = {
    row_number: number;
    sku: string;
    name: string;
    alternate_sku: string | null;
    price: number | null;
    cost: number | null;
    quantity: number | null;
};
export declare function parseMadereriaInventoryExcel(buffer: Buffer): InventoryExcelRow[];
