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
var GlobalInvoiceAutoService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalInvoiceAutoService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("@nestjs/typeorm");
const crypto_1 = require("crypto");
const typeorm_2 = require("typeorm");
const billing_branch_entity_1 = require("../../../entities/billing/billing-branch.entity");
const fiscal_configuration_entity_1 = require("../../../entities/billing/fiscal-configuration.entity");
const global_invoice_auto_run_entity_1 = require("../../../entities/accounting/global-invoice-auto-run.entity");
const public_invoice_policy_util_1 = require("../utils/public-invoice-policy.util");
const global_invoice_service_1 = require("./global-invoice.service");
const STALE_RUN_MS = 15 * 60 * 1000;
let GlobalInvoiceAutoService = GlobalInvoiceAutoService_1 = class GlobalInvoiceAutoService {
    fiscalRepo;
    branchRepo;
    runRepo;
    globalInvoiceService;
    logger = new common_1.Logger(GlobalInvoiceAutoService_1.name);
    running = false;
    constructor(fiscalRepo, branchRepo, runRepo, globalInvoiceService) {
        this.fiscalRepo = fiscalRepo;
        this.branchRepo = branchRepo;
        this.runRepo = runRepo;
        this.globalInvoiceService = globalInvoiceService;
    }
    async handleAutomaticStamp() {
        if (this.running)
            return;
        this.running = true;
        try {
            await this.runDue();
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Error del proceso automático';
            this.logger.error(message);
        }
        finally {
            this.running = false;
        }
    }
    async runDue(now = new Date()) {
        const fiscals = await this.fiscalRepo
            .createQueryBuilder('fiscal')
            .where('fiscal.global_invoice_auto_enabled = 1')
            .andWhere("fiscal.status = 'active'")
            .getMany();
        let stamped = 0;
        let failed = 0;
        for (const fiscal of fiscals) {
            const policy = (0, public_invoice_policy_util_1.readPublicInvoicePolicy)(fiscal);
            const period = (0, public_invoice_policy_util_1.automaticRunPeriod)(policy, now);
            if (!period)
                continue;
            const branches = await this.branchRepo.find({
                where: { fiscal_configuration_id: fiscal.id, status: 1 },
            });
            const local = (0, public_invoice_policy_util_1.zonedParts)(now, policy.timeZone);
            const day = `${local.year}${String(local.month).padStart(2, '0')}${String(local.day).padStart(2, '0')}`;
            const month = `${period.year}-${String(period.month).padStart(2, '0')}`;
            for (const branch of branches) {
                const outcome = await this.runBranch(fiscal, branch, period, month, day);
                if (outcome === 'stamped')
                    stamped += 1;
                if (outcome === 'failed')
                    failed += 1;
            }
        }
        if (stamped || failed) {
            this.logger.log(`Facturas a público en general automáticas: ${stamped} timbradas, ${failed} con error`);
        }
    }
    async runBranch(fiscal, branch, period, month, dayStamp) {
        const run = await this.claim(fiscal, branch, period, dayStamp);
        if (!run)
            return 'skipped';
        try {
            const result = await this.globalInvoiceService.stampAutomaticBranch(fiscal.tenant_id, branch.id, month, run.folio, process.env.NODE_ENV === 'production' ? 'production' : 'demo');
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
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'No se pudo timbrar';
            await this.runRepo.update(run.id, { status: 'failed', message: message.slice(0, 2000) });
            this.logger.warn(`Sucursal ${branch.id}: ${message}`);
            return 'failed';
        }
    }
    async claim(fiscal, branch, period, dayStamp) {
        const existing = await this.runRepo.findOne({
            where: {
                billing_branch_id: branch.id,
                period_year: period.year,
                period_month: period.month,
            },
        });
        if (existing?.status === 'done' || existing?.status === 'skipped')
            return null;
        if (existing?.status === 'running') {
            const updated = new Date(existing.updated_at).getTime();
            if (Number.isFinite(updated) && Date.now() - updated < STALE_RUN_MS)
                return null;
        }
        const folio = existing?.folio || (await this.nextFolio(fiscal.tenant_id, dayStamp));
        if (!existing) {
            const row = this.runRepo.create({
                id: (0, crypto_1.randomUUID)(),
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
            }
            catch (error) {
                if (this.isDuplicate(error))
                    return null;
                throw error;
            }
        }
        existing.status = 'running';
        existing.folio = folio;
        existing.message = null;
        await this.runRepo.save(existing);
        return existing;
    }
    async nextFolio(tenantId, dayStamp) {
        const prefix = `FAPG-${dayStamp}-`;
        const taken = await this.runRepo
            .createQueryBuilder('run')
            .where('run.tenant_id = :tenantId', { tenantId })
            .andWhere('run.folio LIKE :prefix', { prefix: `${prefix}%` })
            .getCount();
        return `${prefix}${String(taken + 1).padStart(2, '0')}`;
    }
    isDuplicate(error) {
        if (!(error instanceof typeorm_2.QueryFailedError))
            return false;
        const driver = error
            .driverError;
        return driver?.errno === 1062 || driver?.code === 'ER_DUP_ENTRY';
    }
};
exports.GlobalInvoiceAutoService = GlobalInvoiceAutoService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_10_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], GlobalInvoiceAutoService.prototype, "handleAutomaticStamp", null);
exports.GlobalInvoiceAutoService = GlobalInvoiceAutoService = GlobalInvoiceAutoService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(fiscal_configuration_entity_1.FiscalConfiguration)),
    __param(1, (0, typeorm_1.InjectRepository)(billing_branch_entity_1.BillingBranch)),
    __param(2, (0, typeorm_1.InjectRepository)(global_invoice_auto_run_entity_1.GlobalInvoiceAutoRun)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        global_invoice_service_1.GlobalInvoiceService])
], GlobalInvoiceAutoService);
//# sourceMappingURL=global-invoice-auto.service.js.map