import { Repository } from 'typeorm';
import { ExchangeRate } from '../../entities/billing/exchange-rate.entity';
import { SetDailyExchangeRateDto } from './dto/set-daily-exchange-rate.dto';
import { QueryExchangeRateDto } from './dto/query-exchange-rate.dto';
export declare class ExchangeRateService {
    private readonly exchangeRateRepository;
    private readonly logger;
    constructor(exchangeRateRepository: Repository<ExchangeRate>);
    carryForwardOpenDays(): Promise<void>;
    setDailyRate(tenantId: string, dto: SetDailyExchangeRateDto): Promise<ExchangeRate>;
    getDailyRate(tenantId: string, date?: string): Promise<ExchangeRate | null>;
    findAll(tenantId: string, query: QueryExchangeRateDto): Promise<{
        data: ExchangeRate[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    }>;
    private carryForwardUntil;
    private findRowForDate;
    private normalizeDate;
}
