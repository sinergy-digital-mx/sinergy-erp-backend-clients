import { Repository } from 'typeorm';
import { Quotation } from '../../../entities/quotations/quotation.entity';
export declare class QuotationFolioService {
    private readonly quotationRepo;
    constructor(quotationRepo: Repository<Quotation>);
    generateFolio(tenantId: string): Promise<string>;
}
