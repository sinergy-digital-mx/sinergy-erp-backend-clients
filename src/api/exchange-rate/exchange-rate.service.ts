import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExchangeRate } from '../../entities/billing/exchange-rate.entity';
import { SetDailyExchangeRateDto } from './dto/set-daily-exchange-rate.dto';
import { QueryExchangeRateDto } from './dto/query-exchange-rate.dto';
import { getTodayDateString } from '../pos-shifts/utils/unclosed-shift-alert';
import { buildMissingDailyRates } from './exchange-rate-carry.util';

@Injectable()
export class ExchangeRateService {
  private readonly logger = new Logger(ExchangeRateService.name);

  constructor(
    @InjectRepository(ExchangeRate)
    private readonly exchangeRateRepository: Repository<ExchangeRate>,
  ) {}

  @Cron('15 8 * * *')
  async carryForwardOpenDays(): Promise<void> {
    const today = getTodayDateString();
    const tenants: Array<{ tenant_id: string }> = await this.exchangeRateRepository
      .createQueryBuilder('rate')
      .select('rate.tenant_id', 'tenant_id')
      .groupBy('rate.tenant_id')
      .getRawMany();

    for (const tenant of tenants) {
      const tenantId = tenant.tenant_id;
      if (!tenantId) {
        continue;
      }
      try {
        await this.carryForwardUntil(tenantId, today);
      } catch (error) {
        this.logger.error(`No se pudo arrastrar el tipo de cambio de ${tenantId}`, error);
      }
    }
  }

  async setDailyRate(tenantId: string, dto: SetDailyExchangeRateDto): Promise<ExchangeRate> {
    const rateDate = this.normalizeDate(dto.rate_date);
    const notes = dto.notes?.trim() || null;
    const existing = await this.findRowForDate(tenantId, rateDate);
    if (existing) {
      existing.exchange_rate = dto.exchange_rate;
      existing.notes = notes;
      return this.exchangeRateRepository.save(existing);
    }
    const row = this.exchangeRateRepository.create({
      tenant_id: tenantId,
      rate_date: rateDate,
      exchange_rate: dto.exchange_rate,
      notes,
    });
    return this.exchangeRateRepository.save(row);
  }

  async getDailyRate(tenantId: string, date?: string): Promise<ExchangeRate | null> {
    const requested = this.normalizeDate(date);
    const today = getTodayDateString();
    const rateDate = requested > today ? today : requested;
    await this.carryForwardUntil(tenantId, rateDate);
    return this.findRowForDate(tenantId, rateDate);
  }

  async findAll(tenantId: string, query: QueryExchangeRateDto) {
    await this.carryForwardUntil(tenantId, getTodayDateString());
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

  private async carryForwardUntil(tenantId: string, untilDate: string): Promise<void> {
    const rows = await this.exchangeRateRepository
      .createQueryBuilder('rate')
      .where('rate.tenant_id = :tenantId', { tenantId })
      .andWhere('rate.rate_date <= :untilDate', { untilDate })
      .orderBy('rate.rate_date', 'ASC')
      .addOrderBy('rate.created_at', 'DESC')
      .addOrderBy('rate.id', 'DESC')
      .getMany();

    const missing = buildMissingDailyRates(rows, untilDate);
    if (missing.length === 0) {
      return;
    }

    await this.exchangeRateRepository.save(
      missing.map((day) =>
        this.exchangeRateRepository.create({
          tenant_id: tenantId,
          rate_date: day.rate_date,
          exchange_rate: day.exchange_rate,
          notes: null,
        }),
      ),
    );
  }

  private findRowForDate(tenantId: string, rateDate: string): Promise<ExchangeRate | null> {
    return this.exchangeRateRepository
      .createQueryBuilder('rate')
      .where('rate.tenant_id = :tenantId', { tenantId })
      .andWhere('rate.rate_date = :rateDate', { rateDate })
      .orderBy('rate.created_at', 'DESC')
      .addOrderBy('rate.id', 'DESC')
      .getOne();
  }

  private normalizeDate(date?: string): string {
    if (date && Number.isNaN(Date.parse(date))) {
      throw new BadRequestException('Invalid date format, expected YYYY-MM-DD');
    }

    if (date) {
      return date.slice(0, 10);
    }

    return getTodayDateString();
  }
}
