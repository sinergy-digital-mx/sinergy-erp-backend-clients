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
var PropertyImportService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertyImportService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const crypto_1 = require("crypto");
const typeorm_2 = require("typeorm");
const property_entity_1 = require("../../entities/properties/property.entity");
const measurement_unit_entity_1 = require("../../entities/properties/measurement-unit.entity");
const customer_groups_service_1 = require("../customers/customer-groups.service");
const contract_currency_util_1 = require("../contracts/contract-currency.util");
const property_pricing_util_1 = require("./utils/property-pricing.util");
const property_import_util_1 = require("./utils/property-import.util");
const property_import_job_store_1 = require("./property-import-job.store");
let PropertyImportService = PropertyImportService_1 = class PropertyImportService {
    propertyRepo;
    measurementUnitRepo;
    customerGroupsService;
    logger = new common_1.Logger(PropertyImportService_1.name);
    constructor(propertyRepo, measurementUnitRepo, customerGroupsService) {
        this.propertyRepo = propertyRepo;
        this.measurementUnitRepo = measurementUnitRepo;
        this.customerGroupsService = customerGroupsService;
    }
    async exportTemplate(organizationId) {
        const [units, groups] = await Promise.all([
            this.measurementUnitRepo.find({ order: { system: 'ASC', name: 'ASC' } }),
            this.customerGroupsService.findOptions(organizationId),
        ]);
        const buffer = await (0, property_import_util_1.buildPropertyImportTemplate)({
            units: units.map((unit) => ({
                code: unit.code,
                name: unit.name,
                symbol: unit.symbol,
            })),
            groups: groups.map((group) => ({ name: group.name })),
        });
        return { buffer, filename: 'plantilla-lotes.xlsx' };
    }
    async startImportJob(organizationId, file) {
        const { ready, skipped } = await this.resolveReadyRows(organizationId, file);
        const job = (0, property_import_job_store_1.createPropertyImportJob)({
            id: (0, crypto_1.randomUUID)(),
            organizationId,
            total: ready.length,
        });
        if (!ready.length) {
            this.completeJob(job.id, 0, skipped);
            return (0, property_import_job_store_1.getPropertyImportJob)(job.id, organizationId) ?? job;
        }
        setImmediate(() => {
            this.runImportJob(job.id, organizationId, ready, skipped).catch((error) => {
                this.logger.error(`Import job ${job.id} failed`, error);
                (0, property_import_job_store_1.updatePropertyImportJob)(job.id, {
                    status: 'failed',
                    message: 'Error al importar',
                    error: this.toErrorMessage(error),
                });
            });
        });
        return job;
    }
    getJobStatus(jobId, organizationId) {
        const job = (0, property_import_job_store_1.getPropertyImportJob)(jobId, organizationId);
        if (!job) {
            throw new common_1.NotFoundException('No encontramos este trabajo de importación.');
        }
        return job;
    }
    async importWorkbook(organizationId, file) {
        const { ready, skipped } = await this.resolveReadyRows(organizationId, file);
        const persistSkipped = await this.persistRows(organizationId, ready);
        const allSkipped = [...skipped, ...persistSkipped];
        return { created: ready.length - persistSkipped.length, skipped: allSkipped };
    }
    async resolveReadyRows(organizationId, file) {
        if (!file?.buffer?.length) {
            throw new common_1.BadRequestException('Adjunta la plantilla de lotes en Excel.');
        }
        const name = (file.originalname || '').toLowerCase();
        if (!name.endsWith('.xlsx') && !name.endsWith('.xls')) {
            throw new common_1.BadRequestException('El archivo debe ser Excel (.xlsx).');
        }
        const parsed = (0, property_import_util_1.parsePropertyImportWorkbook)(file.buffer);
        if (!parsed.rows.length) {
            throw new common_1.BadRequestException(parsed.errors[0]?.message || 'El archivo no tiene lotes para importar.');
        }
        const [units, groups, existing] = await Promise.all([
            this.measurementUnitRepo.find(),
            this.customerGroupsService.findOptions(organizationId),
            this.findExistingCodes(organizationId),
        ]);
        const resolved = (0, property_import_util_1.resolvePropertyImportRows)(parsed.rows, {
            groups: groups.map((group) => ({ id: group.id, name: group.name })),
            units: units.map((unit) => ({
                id: unit.id,
                code: unit.code,
                name: unit.name,
                symbol: unit.symbol,
            })),
            existingCodes: existing,
        }, parsed.errors);
        if (!resolved.ready.length && !resolved.errors.length) {
            throw new common_1.BadRequestException('El archivo no tiene lotes para importar.');
        }
        return { ready: resolved.ready, skipped: resolved.errors };
    }
    async runImportJob(jobId, organizationId, ready, skipped) {
        (0, property_import_job_store_1.updatePropertyImportJob)(jobId, {
            status: 'processing',
            processed: 0,
            message: `Importando 0 de ${ready.length}`,
        });
        try {
            const persistSkipped = await this.persistRows(organizationId, ready, (processed, total, code) => {
                (0, property_import_job_store_1.updatePropertyImportJob)(jobId, {
                    status: 'processing',
                    processed,
                    total,
                    current_code: code,
                    message: `Importando ${processed} de ${total}`,
                });
            });
            this.completeJob(jobId, ready.length - persistSkipped.length, [...skipped, ...persistSkipped]);
        }
        catch (error) {
            (0, property_import_job_store_1.updatePropertyImportJob)(jobId, {
                status: 'failed',
                message: 'Error al importar',
                error: this.toErrorMessage(error),
            });
        }
    }
    completeJob(jobId, created, skipped) {
        const ordered = [...skipped].sort((left, right) => left.row - right.row || left.message.localeCompare(right.message));
        (0, property_import_job_store_1.updatePropertyImportJob)(jobId, {
            status: 'completed',
            current_code: null,
            message: this.summaryMessage(created, ordered.length),
            result: { created, skipped: ordered },
            error: null,
        });
    }
    async persistRows(organizationId, ready, onProgress) {
        const skipped = [];
        let processed = 0;
        for (const item of ready) {
            const dto = item.dto;
            const pricing = (0, property_pricing_util_1.resolvePropertyPricing)({
                totalArea: dto.total_area,
                totalPrice: dto.total_price,
                pricePerM2: dto.price_per_m2,
                isCreate: true,
            });
            try {
                const entity = this.propertyRepo.create({
                    ...dto,
                    tenant_id: organizationId,
                    currency: (0, contract_currency_util_1.normalizeContractCurrency)(dto.currency, contract_currency_util_1.DEFAULT_CONTRACT_CURRENCY),
                    cadastral_key: dto.cadastral_key?.trim() || null,
                    total_price: pricing.total_price,
                    price_per_m2: pricing.price_per_m2,
                    status: dto.status || 'disponible',
                });
                await this.propertyRepo.save(entity);
            }
            catch (error) {
                if (this.isDuplicateCodeError(error)) {
                    skipped.push({
                        row: item.row,
                        code: dto.code,
                        message: `Ya existe un lote con el código "${dto.code}".`,
                    });
                }
                else {
                    throw error;
                }
            }
            processed += 1;
            onProgress?.(processed, ready.length, dto.code);
        }
        return skipped;
    }
    isDuplicateCodeError(error) {
        if (!(error instanceof typeorm_2.QueryFailedError)) {
            return false;
        }
        const driverErr = error.driverError;
        return (driverErr?.code === 'ER_DUP_ENTRY' ||
            driverErr?.errno === 1062 ||
            /Duplicate entry/i.test(error.message));
    }
    summaryMessage(created, skipped) {
        const createdText = created === 1 ? 'Se creó 1 lote.' : `Se crearon ${created} lotes.`;
        if (!skipped) {
            return created === 0 ? 'No se importó ningún lote.' : createdText;
        }
        const skippedText = skipped === 1 ? '1 no se importó.' : `${skipped} no se importaron.`;
        if (!created) {
            return `No se importó ningún lote. ${skippedText}`;
        }
        return `${createdText} ${skippedText}`;
    }
    toErrorMessage(error) {
        if (error instanceof common_1.HttpException) {
            const response = error.getResponse();
            if (typeof response === 'string') {
                return response;
            }
            if (response && typeof response === 'object' && 'message' in response) {
                const message = response.message;
                return Array.isArray(message) ? message.join(', ') : String(message);
            }
        }
        return error instanceof Error ? error.message : 'No se pudieron importar los lotes.';
    }
    async findExistingCodes(organizationId) {
        const rows = await this.propertyRepo
            .createQueryBuilder('p')
            .select('p.code', 'code')
            .where('p.tenant_id = :organizationId', { organizationId })
            .getRawMany();
        return new Set(rows.map((row) => (0, property_import_util_1.foldText)(row.code)));
    }
};
exports.PropertyImportService = PropertyImportService;
exports.PropertyImportService = PropertyImportService = PropertyImportService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(property_entity_1.Property)),
    __param(1, (0, typeorm_1.InjectRepository)(measurement_unit_entity_1.MeasurementUnit)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        customer_groups_service_1.CustomerGroupsService])
], PropertyImportService);
//# sourceMappingURL=property-import.service.js.map