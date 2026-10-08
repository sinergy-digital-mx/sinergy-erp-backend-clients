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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertyImportService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const property_entity_1 = require("../../entities/properties/property.entity");
const measurement_unit_entity_1 = require("../../entities/properties/measurement-unit.entity");
const customer_groups_service_1 = require("../customers/customer-groups.service");
const contract_currency_util_1 = require("../contracts/contract-currency.util");
const property_pricing_util_1 = require("./utils/property-pricing.util");
const property_import_util_1 = require("./utils/property-import.util");
let PropertyImportService = class PropertyImportService {
    propertyRepo;
    measurementUnitRepo;
    customerGroupsService;
    dataSource;
    constructor(propertyRepo, measurementUnitRepo, customerGroupsService, dataSource) {
        this.propertyRepo = propertyRepo;
        this.measurementUnitRepo = measurementUnitRepo;
        this.customerGroupsService = customerGroupsService;
        this.dataSource = dataSource;
    }
    async exportTemplate(_organizationId) {
        const units = await this.measurementUnitRepo.find({ order: { system: 'ASC', name: 'ASC' } });
        const buffer = await (0, property_import_util_1.buildPropertyImportTemplate)({
            units: units.map((unit) => ({
                code: unit.code,
                name: unit.name,
                symbol: unit.symbol,
            })),
        });
        return { buffer, filename: 'plantilla-lotes.xlsx' };
    }
    async importWorkbook(organizationId, file, groupId) {
        if (!file?.buffer?.length) {
            throw new common_1.BadRequestException('Adjunta la plantilla de lotes en Excel.');
        }
        const name = (file.originalname || '').toLowerCase();
        if (!name.endsWith('.xlsx') && !name.endsWith('.xls')) {
            throw new common_1.BadRequestException('El archivo debe ser Excel (.xlsx).');
        }
        const group = await this.customerGroupsService.assertBelongsToOrganization(groupId, organizationId);
        if (!group) {
            throw new common_1.BadRequestException('Selecciona el grupo de cliente.');
        }
        const parsed = (0, property_import_util_1.parsePropertyImportWorkbook)(file.buffer);
        const [units, existing] = await Promise.all([
            this.measurementUnitRepo.find(),
            this.findExistingCodes(organizationId),
        ]);
        const resolved = (0, property_import_util_1.resolvePropertyImportRows)(parsed.rows, {
            groupId: group,
            units: units.map((unit) => ({
                id: unit.id,
                code: unit.code,
                name: unit.name,
                symbol: unit.symbol,
            })),
            existingCodes: existing,
        }, parsed.errors);
        if (resolved.errors.length) {
            throw new common_1.BadRequestException({
                message: 'No se importó ningún lote. Corrige el archivo y vuelve a subirlo.',
                errors: resolved.errors,
            });
        }
        if (!resolved.ready.length) {
            throw new common_1.BadRequestException('El archivo no tiene lotes para importar.');
        }
        await this.dataSource.transaction(async (manager) => {
            for (const dto of resolved.ready) {
                const pricing = (0, property_pricing_util_1.resolvePropertyPricing)({
                    totalArea: dto.total_area,
                    totalPrice: dto.total_price,
                    pricePerM2: dto.price_per_m2,
                    isCreate: true,
                });
                const property = manager.create(property_entity_1.Property, {
                    ...dto,
                    tenant_id: organizationId,
                    currency: (0, contract_currency_util_1.normalizeContractCurrency)(dto.currency, contract_currency_util_1.DEFAULT_CONTRACT_CURRENCY),
                    cadastral_key: dto.cadastral_key?.trim() || null,
                    total_price: pricing.total_price,
                    price_per_m2: pricing.price_per_m2,
                    status: dto.status || 'disponible',
                });
                try {
                    await manager.save(property);
                }
                catch (error) {
                    if (error instanceof typeorm_2.QueryFailedError) {
                        const driverErr = error.driverError;
                        const isDup = driverErr?.code === 'ER_DUP_ENTRY' ||
                            driverErr?.errno === 1062 ||
                            /Duplicate entry/i.test(error.message);
                        if (isDup) {
                            throw new common_1.BadRequestException(`Ya existe un lote con el código "${dto.code}". No se importó ningún lote.`);
                        }
                    }
                    throw error;
                }
            }
        });
        return { created: resolved.ready.length };
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
exports.PropertyImportService = PropertyImportService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(property_entity_1.Property)),
    __param(1, (0, typeorm_1.InjectRepository)(measurement_unit_entity_1.MeasurementUnit)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        customer_groups_service_1.CustomerGroupsService,
        typeorm_2.DataSource])
], PropertyImportService);
//# sourceMappingURL=property-import.service.js.map