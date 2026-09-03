"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ElectronicInvoiceSatSyncService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElectronicInvoiceSatSyncService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const electronic_invoice_entity_1 = require("../../../entities/electronic-invoicing/electronic-invoice.entity");
const electronic_invoice_sync_log_entity_1 = require("../../../entities/electronic-invoicing/electronic-invoice-sync-log.entity");
const electronic_invoice_service_1 = require("./electronic-invoice.service");
const BATCH_SIZE_PER_TENANT = 30;
const SYNC_INTERVAL_HOURS = 6;
let ElectronicInvoiceSatSyncService = ElectronicInvoiceSatSyncService_1 = class ElectronicInvoiceSatSyncService {
    invoiceRepo;
    syncLogRepo;
    electronicInvoiceService;
    logger = new common_1.Logger(ElectronicInvoiceSatSyncService_1.name);
    isRunning = false;
    constructor(invoiceRepo, syncLogRepo, electronicInvoiceService) {
        this.invoiceRepo = invoiceRepo;
        this.syncLogRepo = syncLogRepo;
        this.electronicInvoiceService = electronicInvoiceService;
    }
    async runScheduledSync() {
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
                        const updated = await this.electronicInvoiceService.syncSatStatus(invoice.id, tenantId, null, 'scheduled');
                        totalProcessed++;
                        if (updated.sat_status !== before) {
                            totalUpdated++;
                        }
                    }
                    catch (error) {
                        this.logger.warn(`Error sync factura ${invoice.id} (cliente ${tenantId}): ${error instanceof Error ? error.message : error}`);
                    }
                }
            }
            this.logger.log(`Sync SAT completado: ${totalProcessed} facturas procesadas, ${totalUpdated} actualizadas`);
        }
        finally {
            this.isRunning = false;
        }
    }
    async syncTenantBatch(tenantId, userId, limit = BATCH_SIZE_PER_TENANT) {
        const invoices = await this.getPendingInvoicesForTenant(tenantId, limit);
        let processed = 0;
        let updated = 0;
        for (const invoice of invoices) {
            const before = invoice.sat_status;
            await this.electronicInvoiceService.syncSatStatus(invoice.id, tenantId, userId, userId ? 'manual' : 'batch');
            processed++;
            const refreshed = await this.invoiceRepo.findOne({ where: { id: invoice.id } });
            if (refreshed && refreshed.sat_status !== before) {
                updated++;
            }
        }
        return { processed, updated };
    }
    async getSyncStatus(tenantId) {
        const pendingCount = await this.invoiceRepo
            .createQueryBuilder('inv')
            .where('inv.tenant_id = :tenantId', { tenantId })
            .andWhere('inv.sat_sync_enabled = 1')
            .andWhere('inv.stamp_status IN (:...statuses)', {
            statuses: ['stamped', 'cancel_pending'],
        })
            .andWhere('inv.uuid IS NOT NULL')
            .andWhere('(inv.sat_last_sync_at IS NULL OR inv.sat_last_sync_at < DATE_SUB(NOW(), INTERVAL :hours HOUR))', { hours: SYNC_INTERVAL_HOURS })
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
    async getTenantsWithPendingSync() {
        const rows = await this.invoiceRepo
            .createQueryBuilder('inv')
            .select('DISTINCT inv.tenant_id', 'tenant_id')
            .where('inv.sat_sync_enabled = 1')
            .andWhere('inv.stamp_status IN (:...statuses)', {
            statuses: ['stamped', 'cancel_pending'],
        })
            .andWhere('inv.uuid IS NOT NULL')
            .andWhere('(inv.sat_last_sync_at IS NULL OR inv.sat_last_sync_at < DATE_SUB(NOW(), INTERVAL :hours HOUR))', { hours: SYNC_INTERVAL_HOURS })
            .getRawMany();
        return rows.map((r) => r.tenant_id);
    }
    async getPendingInvoicesForTenant(tenantId, limit = BATCH_SIZE_PER_TENANT) {
        return this.invoiceRepo
            .createQueryBuilder('inv')
            .where('inv.tenant_id = :tenantId', { tenantId })
            .andWhere('inv.sat_sync_enabled = 1')
            .andWhere('inv.stamp_status IN (:...statuses)', {
            statuses: ['stamped', 'cancel_pending'],
        })
            .andWhere('inv.uuid IS NOT NULL')
            .andWhere('(inv.sat_last_sync_at IS NULL OR inv.sat_last_sync_at < DATE_SUB(NOW(), INTERVAL :hours HOUR))', { hours: SYNC_INTERVAL_HOURS })
            .orderBy('inv.sat_last_sync_at', 'ASC')
            .take(limit)
            .getMany();
    }
};
exports.ElectronicInvoiceSatSyncService = ElectronicInvoiceSatSyncService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_30_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ElectronicInvoiceSatSyncService.prototype, "runScheduledSync", null);
exports.ElectronicInvoiceSatSyncService = ElectronicInvoiceSatSyncService = ElectronicInvoiceSatSyncService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(electronic_invoice_entity_1.ElectronicInvoice)),
    __param(1, (0, typeorm_1.InjectRepository)(electronic_invoice_sync_log_entity_1.ElectronicInvoiceSyncLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        electronic_invoice_service_1.ElectronicInvoiceService])
], ElectronicInvoiceSatSyncService);
//# sourceMappingURL=electronic-invoice-sat-sync.service.js.map