import { DataSource } from 'typeorm';
export declare class QuotationExpirationService {
    private readonly dataSource;
    private readonly logger;
    constructor(dataSource: DataSource);
    handleDailyExpiration(): Promise<void>;
    cancelExpiredQuotations(): Promise<number>;
}
