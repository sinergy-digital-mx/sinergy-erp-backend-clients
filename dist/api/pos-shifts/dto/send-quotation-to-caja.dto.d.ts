import { CreateQuotationLineItemDto } from '../../quotations/dto/create-quotation.dto';
export declare class SendQuotationToCajaDto {
    line_items?: CreateQuotationLineItemDto[];
    customer_id?: number;
    warehouse_id?: string;
    global_discount_id?: string;
    notes?: string;
    advance_amount?: number;
    advance_uso_cfdi?: string;
    advance_metodo_pago?: 'PUE' | 'PPD';
}
