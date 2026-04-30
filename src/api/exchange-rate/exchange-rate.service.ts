import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExchangeRate } from '../../entities/billing/exchange-rate.entity';
import { SetDailyExchangeRateDto } from './dto/set-daily-exchange-rate.dto';
import { QueryExchangeRateDto } from './dto/query-exchange-rate.dto';

@Injectable()
export class ExchangeRateService {
  constructor(
    @InjectRepository(ExchangeRate)
    private readonly exchangeRateRepository: Repository<ExchangeRate>,
  ) {}

  async setDailyRate(tenantId: string, dto: SetDailyExchangeRateDto): Promise<ExchangeRate> {
    const rateDate = this.normalizeDate(dto.rate_date);
    const row = this.exchangeRateRepository.create({
      tenant_id: tenantId,
      rate_date: rateDate,
      exchange_rate: dto.exchange_rate,
      notes: dto.notes,
    });
    return this.exchangeRateRepository.save(row);
  }

  async getDailyRate(tenantId: string, date?: string): Promise<ExchangeRate | null> {
    const rateDate = this.normalizeDate(date);
    return this.exchangeRateRepository
      .createQueryBuilder('rate')
      .where('rate.tenant_id = :tenantId', { tenantId })
      .andWhere('rate.rate_date = :rateDate', { rateDate })
      .orderBy('rate.created_at', 'DESC')
      .addOrderBy('rate.id', 'DESC')
      .getOne();
  }

  async findAll(tenantId: string, query: QueryExchangeRateDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const safePage = page < 1 ? 1 : page;
    const safeLimit = limit < 1 ? 1 : Math.min(limit, 100);

    const qb = this.exchangeRateRepository
      .createQueryBuilder('rate')
      .where('rate.tenant_id = :tenantId', { tenantId });

    if (query.from_date) {
      qb.andWhere('rate.rate_date >= :fromDate', { fromDate: query.from_date });
    }

    if (query.to_date) {
      qb.andWhere('rate.rate_date <= :toDate', { toDate: query.to_date });
    }

    qb.orderBy('rate.rate_date', 'DESC').addOrderBy('rate.created_at', 'DESC');

    const total = await qb.getCount();
    const data = await qb.skip((safePage - 1) * safeLimit).take(safeLimit).getMany();
    const totalPages = Math.ceil(total / safeLimit);

    return {
      data,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages,
      hasNext: safePage < totalPages,
      hasPrev: safePage > 1,
    };
  }

  private normalizeDate(date?: string): string {
    if (date && Number.isNaN(Date.parse(date))) {
      throw new BadRequestException('Invalid date format, expected YYYY-MM-DD');
    }

    if (date) {
      return new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10);
    }

    return new Date().toISOString().slice(0, 10);
  }
}
