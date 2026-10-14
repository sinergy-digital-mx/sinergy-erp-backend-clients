export interface ExchangeRateDaySource {
    rate_date: string | Date;
    exchange_rate: number | string;
}
export interface CarriedExchangeRateDay {
    rate_date: string;
    exchange_rate: number;
}
export declare function buildMissingDailyRates(rows: ExchangeRateDaySource[], untilDate: string): CarriedExchangeRateDay[];
