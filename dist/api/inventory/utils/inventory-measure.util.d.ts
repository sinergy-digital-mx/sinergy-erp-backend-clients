export type MeasureQuantityInput = {
    measure?: unknown;
    measure_uom_id?: unknown;
    measure_uom_name?: unknown;
    measure_uom?: {
        id?: string | null;
        name?: string | null;
    } | null;
    available_quantity?: unknown;
    initial_quantity?: unknown;
};
export type MeasureTotal = {
    measure: string | null;
    measure_uom_id: string | null;
    measure_uom_name: string | null;
    measure_label: string | null;
    total_available_quantity: string;
    total_initial_quantity: string;
    total_batches: number;
};
export type BatchMeasureFields = {
    measure: string | null;
    measure_uom_id: string | null;
    measure_uom_name: string | null;
    measure_label: string | null;
};
export declare function formatMeasure(value: unknown): string | null;
export declare function normalizeMeasure(value: unknown): number | null;
export declare function formatMeasureLabel(measure: unknown, uomName?: unknown): string | null;
export declare function mapBatchMeasure(batch: {
    measure?: unknown;
    measure_uom_id?: unknown;
    measure_uom?: {
        id?: string | null;
        name?: string | null;
    } | null;
    measure_uom_name?: unknown;
}): BatchMeasureFields;
export declare function buildMeasureTotals(batches: MeasureQuantityInput[]): MeasureTotal[];
export declare function formatMeasureTotalsLabel(totals: MeasureTotal[]): string;
