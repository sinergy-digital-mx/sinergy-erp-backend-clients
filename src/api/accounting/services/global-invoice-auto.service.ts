import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { QueryFailedError, Repository } from 'typeorm';
import { BillingBranch } from '../../../entities/billing/billing-branch.entity';
import { FiscalConfiguration } from '../../../entities/billing/fiscal-configuration.entity';
import { GlobalInvoiceAutoRun } from '../../../entities/accounting/global-invoice-auto-run.entity';
import {
  automaticRunPeriod,
  readPublicInvoicePolicy,
  zonedParts,
} from '../utils/public-invoice-policy.util';
import { GlobalInvoiceService } from './global-invoice.service';

const STALE_RUN_MS = 15 * 60 * 1000;

type RunPeriod = { year: number; month: number };
type BranchOutcome = 'stamped' | 'failed' | 'skipped';

@Injectable()
export class GlobalInvoiceAutoService {
  private readonly logger = new Logger(GlobalInvoiceAutoService.name);
  private running = false;

  constructor(
    @InjectRepository(FiscalConfiguration)
    private readonly fiscalRepo: Repository<FiscalConfiguration>,
    @InjectRepository(BillingBranch)
    private readonly branchRepo: Repository<BillingBranch>,
    @InjectRepository(GlobalInvoiceAutoRun)
    private readonly runRepo: Repository<GlobalInvoiceAutoRun>,
    private readonly globalInvoiceService: GlobalInvoiceService,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleAutomaticStamp(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      await this.runDue();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error del proceso automático';
      this.logger.error(message);
    } finally {
      this.running = false;
    }
  }

  async runDue(now: Date = new Date()): Promise<void> {
    const fiscals = await this.fiscalRepo
      .createQueryBuilder('fiscal')
      .where('fiscal.global_invoice_auto_enabled = 1')
      .andWhere("fiscal.status = 'active'")
      .getMany();

    let stamped = 0;
    let failed = 0;
    for (const fiscal of fiscals) {
      const policy = readPublicInvoicePolicy(fiscal);
      const period = automaticRunPeriod(policy, now);
      if (!period) continue;

      const branches = await this.branchRepo.find({
        where: { fiscal_configuration_id: fiscal.id, status: 1 },
      });
      const local = zonedParts(now, policy.timeZone);
      const day = `${local.year}${String(local.month).padStart(2, '0')}${String(local.day).padStart(2, '0')}`;
      const month = `${period.year}-${String(period.month).padStart(2, '0')}`;

      for (const branch of branches) {
        const outcome = await this.runBranch(fiscal, branch, period, month, day);
        if (outcome === 'stamped') stamped += 1;
        if (outcome === 'failed') failed += 1;
      }
    }

    if (stamped || failed) {
      this.logger.log(
        `Facturas a público en general automáticas: ${stamped} timbradas, ${failed} con error`,
      );
    }
  }

  private async runBranch(
    fiscal: FiscalConfiguration,
    branch: BillingBranch,
    period: RunPeriod,
    month: string,
    dayStamp: string,
  ): Promise<BranchOutcome> {
    const run = await this.claim(fiscal, branch, period, dayStamp);
    if (!run) return 'skipped';

    try {
      const result = await this.globalInvoiceService.stampAutomaticBranch(
        fiscal.tenant_id,
        branch.id,
        month,
        run.folio,
        process.env.NODE_ENV === 'production' ? 'production' : 'demo',
      );
      if (result === 'stamped') {
        await this.runRepo.update(run.id, { status: 'done', message: null });
        return 'stamped';
      }
      if (result === 'empty') {
        await this.runRepo.delete(run.id);
        return 'skipped';
      }
      await this.runRepo.update(run.id, {
        status: 'skipped',
        message: 'La sucursal ya tenía factura a público en general en el mes.',
      });
      return 'skipped';
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo timbrar';
      await this.runRepo.update(run.id, { status: 'failed', message: message.slice(0, 2000) });
      this.logger.warn(`Sucursal ${branch.id}: ${message}`);
      return 'failed';
    }
  }

  private async claim(
    fiscal: FiscalConfiguration,
    branch: BillingBranch,
    period: RunPeriod,
    dayStamp: string,
  ): Promise<GlobalInvoiceAutoRun | null> {
    const existing = await this.runRepo.findOne({
      where: {
        billing_branch_id: branch.id,
        period_year: period.year,
        period_month: period.month,
      },
    });
    if (existing?.status === 'done' || existing?.status === 'skipped') return null;
    if (existing?.status === 'running') {
      const updated = new Date(existing.updated_at).getTime();
      if (Number.isFinite(updated) && Date.now() - updated < STALE_RUN_MS) return null;
    }

    const folio = existing?.folio || (await this.nextFolio(fiscal.tenant_id, dayStamp));
    if (!existing) {
      const row = this.runRepo.create({
        id: randomUUID(),
        tenant_id: fiscal.tenant_id,
        fiscal_configuration_id: fiscal.id,
        billing_branch_id: branch.id,
        period_year: period.year,
        period_month: period.month,
        folio,
        status: 'running',
        message: null,
        global_invoice_id: null,
      });
      try {
        await this.runRepo.insert(row);
        return row;
      } catch (error) {
        if (this.isDuplicate(error)) return null;
        throw error;
      }
    }

    existing.status = 'running';
    existing.folio = folio;
    existing.message = null;
    await this.runRepo.save(existing);
    return existing;
  }

  private async nextFolio(tenantId: string, dayStamp: string): Promise<string> {
    const prefix = `FAPG-${dayStamp}-`;
    const taken = await this.runRepo
      .createQueryBuilder('run')
      .where('run.tenant_id = :tenantId', { tenantId })
      .andWhere('run.folio LIKE :prefix', { prefix: `${prefix}%` })
      .getCount();
    return `${prefix}${String(taken + 1).padStart(2, '0')}`;
  }

  private isDuplicate(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) return false;
    const driver = (error as QueryFailedError & { driverError?: { errno?: number; code?: string } })
      .driverError;
    return driver?.errno === 1062 || driver?.code === 'ER_DUP_ENTRY';
  }
}
