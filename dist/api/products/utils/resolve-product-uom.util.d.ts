import { QueryRunner } from 'typeorm';
export type ResolvedProductUom = {
    id: string;
    factor: number;
    is_base: boolean;
    uom_catalog_id: string;
};
export declare function resolveProductUomForLine(qr: QueryRunner, productId: string, providedUomId: string, tenantId: string): Promise<ResolvedProductUom>;
