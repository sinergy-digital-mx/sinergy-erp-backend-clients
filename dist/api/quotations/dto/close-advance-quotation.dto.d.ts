import { CreateQuotationLineItemDto } from './create-quotation.dto';
export declare class CloseAdvanceQuotationDto {
    line_items: CreateQuotationLineItemDto[];
    environment?: 'demo' | 'production';
}
