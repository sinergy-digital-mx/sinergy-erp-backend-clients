import { ExchangeRateService } from './exchange-rate.service';
import { SetDailyExchangeRateDto } from './dto/set-daily-exchange-rate.dto';
import { QueryExchangeRateDto } from './dto/query-exchange-rate.dto';
export declare class ExchangeRateController {
    private readonly exchangeRateService;
    constructor(exchangeRateService: ExchangeRateService);
    setDailyRate(dto: SetDailyExchangeRateDto, req: any): Promise<import("../../entities/billing").ExchangeRate>;
    getDailyRate(date: string | undefined, req: any): Promise<import("../../entities/billing").ExchangeRate | null>;
    findAll(query: QueryExchangeRateDto, req: any): Promise<{
        data: import("../../entities/billing").ExchangeRate[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    }>;
    private getTenantId;
}
