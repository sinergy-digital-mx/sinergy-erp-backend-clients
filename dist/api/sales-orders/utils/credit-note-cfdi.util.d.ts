import { AdvanceParty, BuiltCfdiAmounts } from '../../electronic-invoicing/utils/advance-cfdi.util';
export interface SalesCreditNoteCfdiInput {
    series?: string | null;
    folio: string;
    totalAmount: number;
    ivaPercentage: number;
    usoCfdi: string;
    formaPago: string;
    emisor: AdvanceParty;
    receptor: AdvanceParty;
    descripcion: string;
    relatedUuid: string;
    satClave?: string | null;
    unitCode?: string | null;
    unitName?: string | null;
    currency?: string | null;
    exchangeRate?: number | null;
}
export declare function buildSalesCreditNoteCfdi(input: SalesCreditNoteCfdiInput): BuiltCfdiAmounts;
