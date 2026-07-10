import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ElectronicInvoice } from '../../../entities/electronic-invoicing/electronic-invoice.entity';
import { ElectronicInvoiceSyncLog } from '../../../entities/electronic-invoicing/electronic-invoice-sync-log.entity';
import { ElectronicInvoiceService } from './electronic-invoice.service';

const BATCH_SIZE_PER_TENANT = 30;
const SYNC_INTERVAL_HOURS = 6;

@Injectable()
export class ElectronicInvoiceSatSyncService {
  private readonly logger = new Logger(ElectronicInvoiceSatSyncService.name);
  private isRunning = false;

  constructor(
    @InjectRepository(ElectronicInvoice)
    private readonly invoiceRepo: Repository<ElectronicInvoice>,
    @InjectRepository(ElectronicInvoiceSyncLog)
    private readonly syncLogRepo: Repository<ElectronicInvoiceSyncLog>,
    private readonly electronicInvoiceService: ElectronicInvoiceService,
  ) {}

  /**
   * Sincronización programada multi-cliente.
   * Procesa facturas timbradas o en cancelación pendiente cuyo último sync supera el intervalo.
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async runScheduledSync(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Sync SAT ya en ejecución, omitiendo ciclo');
      return;
    }

    this.isRunning = true;
    this.logger.log('Iniciando sincronización SAT programada');

    try {
      const tenantIds = await this.getTenantsWithPendingSync();
      let totalProcessed = 0;
      let totalUpdated = 0;

      for (const tenantId of tenantIds) {
        const invoices = await this.getPendingInvoicesForTenant(tenantId);
        for (const invoice of invoices) {
          try {
            const before = invoice.sat_status;
            const updated = await this.electronicInvoiceService.syncSatStatus(
              invoice.id,
              tenantId,
              null,
              'scheduled',
            );
            totalProcessed++;
            if (updated.sat_status !== before) {
              totalUpdated++;
            }
          } catch (error) {
            this.logger.warn(
              `Error sync factura ${invoice.id} (cliente ${tenantId}): ${error instanceof Error ? error.message : error}`,
            );
          }
        }
      }

      this.logger.log(
        `Sync SAT completado: ${totalProcessed} facturas procesadas, ${totalUpdated} actualizadas`,
      );
    } finally {
      this.isRunning = false;
    }
  }

  async syncTenantBatch(
    tenantId: string,
    userId: string | null,
    limit = BATCH_SIZE_PER_TENANT,
  ): Promise<{ processed: number; updated: number }> {
    const invoices = await this.getPendingInvoicesForTenant(tenantId, limit);
    let processed = 0;
    let updated = 0;

    for (const invoice of invoices) {
      const before = invoice.sat_status;
      await this.electronicInvoiceService.syncSatStatus(
        invoice.id,
        tenantId,
        userId,
        userId ? 'manual' : 'batch',
      );
      processed++;
      const refreshed = await this.invoiceRepo.findOne({ where: { id: invoice.id } });
      if (refreshed && refreshed.sat_status !== before) {
        updated++;
      }
    }

    return { processed, updated };
  }

  async getSyncStatus(tenantId: string): Promise<{
    pending_count: number;
    last_batch_at: Date | null;
    recent_logs: ElectronicInvoiceSyncLog[];
  }> {
    const pendingCount = await this.invoiceRepo
      .createQueryBuilder('inv')
      .where('inv.tenant_id = :tenantId', { tenantId })
      .andWhere('inv.sat_sync_enabled = 1')
      .andWhere('inv.stamp_status IN (:...statuses)', {
        statuses: ['stamped', 'cancel_pending'],
      })
      .andWhere('inv.uuid IS NOT NULL')
      .andWhere(
        '(inv.sat_last_sync_at IS NULL OR inv.sat_last_sync_at < DATE_SUB(NOW(), INTERVAL :hours HOUR))',
        { hours: SYNC_INTERVAL_HOURS },
      )
      .getCount();

    const lastBatch = await this.syncLogRepo.findOne({
      where: { tenant_id: tenantId, trigger_type: 'batch' },
      order: { created_at: 'DESC' },
    });

    const recentLogs = await this.syncLogRepo.find({
      where: { tenant_id: tenantId },
      order: { created_at: 'DESC' },
      take: 20,
    });

    return {
      pending_count: pendingCount,
      last_batch_at: lastBatch?.created_at ?? null,
      recent_logs: recentLogs,
    };
  }

  private async getTenantsWithPendingSync(): Promise<string[]> {
    const rows = await this.invoiceRepo
      .createQueryBuilder('inv')
      .select('DISTINCT inv.tenant_id', 'tenant_id')
      .where('inv.sat_sync_enabled = 1')
      .andWhere('inv.stamp_status IN (:...statuses)', {
        statuses: ['stamped', 'cancel_pending'],
      })
      .andWhere('inv.uuid IS NOT NULL')
      .andWhere(
        '(inv.sat_last_sync_at IS NULL OR inv.sat_last_sync_at < DATE_SUB(NOW(), INTERVAL :hours HOUR))',
        { hours: SYNC_INTERVAL_HOURS },
      )
      .getRawMany<{ tenant_id: string }>();

    return rows.map((r) => r.tenant_id);
  }

  private async getPendingInvoicesForTenant(
    tenantId: string,
    limit = BATCH_SIZE_PER_TENANT,
  ): Promise<ElectronicInvoice[]> {
    return this.invoiceRepo
      .createQueryBuilder('inv')
      .where('inv.tenant_id = :tenantId', { tenantId })
      .andWhere('inv.sat_sync_enabled = 1')
      .andWhere('inv.stamp_status IN (:...statuses)', {
        statuses: ['stamped', 'cancel_pending'],
      })
      .andWhere('inv.uuid IS NOT NULL')
      .andWhere(
        '(inv.sat_last_sync_at IS NULL OR inv.sat_last_sync_at < DATE_SUB(NOW(), INTERVAL :hours HOUR))',
        { hours: SYNC_INTERVAL_HOURS },
      )
      .orderBy('inv.sat_last_sync_at', 'ASC')
      .take(limit)
      .getMany();
  }
}
