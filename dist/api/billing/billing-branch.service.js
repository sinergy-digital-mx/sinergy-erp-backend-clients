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
exports.BillingBranchService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const billing_branch_entity_1 = require("../../entities/billing/billing-branch.entity");
const fiscal_configuration_entity_1 = require("../../entities/billing/fiscal-configuration.entity");
const warehouse_entity_1 = require("../../entities/warehouse/warehouse.entity");
const document_prefix_util_1 = require("../../common/utils/document-prefix.util");
const crypto_1 = require("crypto");
let BillingBranchService = class BillingBranchService {
    branchRepository;
    fiscalConfigRepository;
    warehouseRepository;
    constructor(branchRepository, fiscalConfigRepository, warehouseRepository) {
        this.branchRepository = branchRepository;
        this.fiscalConfigRepository = fiscalConfigRepository;
        this.warehouseRepository = warehouseRepository;
    }
    async create(fiscalConfigId, tenantId, dto) {
        const name = this.resolveBranchName(dto);
        await this.assertFiscalConfiguration(fiscalConfigId, tenantId);
        const existingBranch = await this.branchRepository
            .createQueryBuilder('branch')
            .where('branch.fiscal_configuration_id = :fiscalConfigId', { fiscalConfigId })
            .andWhere('LOWER(branch.code) = LOWER(:name)', { name })
            .getOne();
        if (existingBranch) {
            throw new common_1.ConflictException('Ya existe una sucursal con ese nombre');
        }
        const { warehouses, name: _name, code: _code, ...branchData } = dto;
        const branch = this.branchRepository.create({
            ...branchData,
            code: name,
            prefix: (0, document_prefix_util_1.normalizeDocumentPrefix)(dto.prefix),
            fiscal_configuration_id: fiscalConfigId,
            status: dto.status ?? 1,
        });
        const savedBranch = await this.branchRepository.save(branch);
        if (warehouses?.length) {
            await this.syncWarehouses(savedBranch.id, tenantId, warehouses);
        }
        return this.findOne(savedBranch.id, fiscalConfigId, tenantId);
    }
    async findAll(fiscalConfigId, tenantId) {
        await this.assertFiscalConfiguration(fiscalConfigId, tenantId);
        const branches = await this.branchRepository
            .createQueryBuilder('branch')
            .where('branch.fiscal_configuration_id = :fiscalConfigId', { fiscalConfigId })
            .loadRelationCountAndMap('branch.warehousesCount', 'branch.warehouses')
            .orderBy('branch.code', 'ASC')
            .getMany();
        return branches.map((branch) => {
            const { warehousesCount, ...rest } = branch;
            return {
                ...rest,
                name: rest.code,
                warehouses_count: warehousesCount ?? 0,
            };
        });
    }
    async findOne(id, fiscalConfigId, tenantId) {
        await this.assertFiscalConfiguration(fiscalConfigId, tenantId);
        const branch = await this.branchRepository.findOne({
            where: { id, fiscal_configuration_id: fiscalConfigId },
        });
        if (!branch) {
            throw new common_1.NotFoundException('Sucursal no encontrada');
        }
        const warehouses = await this.warehouseRepository.find({
            where: { billing_branch_id: id, tenant_id: tenantId },
            order: { name: 'ASC' },
        });
        return this.toBranchDetailResponse(branch, warehouses);
    }
    async update(id, fiscalConfigId, tenantId, dto) {
        const branch = await this.branchRepository.findOne({
            where: { id, fiscal_configuration_id: fiscalConfigId },
        });
        if (!branch) {
            await this.assertFiscalConfiguration(fiscalConfigId, tenantId);
            throw new common_1.NotFoundException('Sucursal no encontrada');
        }
        await this.assertFiscalConfiguration(fiscalConfigId, tenantId);
        const { warehouses, name: incomingName, ...branchData } = dto;
        if (branchData.prefix !== undefined) {
            branchData.prefix = (0, document_prefix_util_1.normalizeDocumentPrefix)(branchData.prefix);
        }
        if (incomingName !== undefined || branchData.code !== undefined) {
            const name = this.resolveBranchName({ name: incomingName, code: branchData.code });
            const existingBranch = await this.branchRepository
                .createQueryBuilder('branch')
                .where('branch.fiscal_configuration_id = :fiscalConfigId', { fiscalConfigId })
                .andWhere('LOWER(branch.code) = LOWER(:name)', { name })
                .andWhere('branch.id != :id', { id })
                .getOne();
            if (existingBranch) {
                throw new common_1.ConflictException('Ya existe una sucursal con ese nombre');
            }
            branchData.code = name;
        }
        Object.assign(branch, branchData);
        await this.branchRepository.save(branch);
        if (warehouses !== undefined) {
            await this.syncWarehouses(id, tenantId, warehouses);
        }
        return this.findOne(id, fiscalConfigId, tenantId);
    }
    async remove(id, fiscalConfigId, tenantId) {
        await this.assertFiscalConfiguration(fiscalConfigId, tenantId);
        const branch = await this.branchRepository.findOne({
            where: { id, fiscal_configuration_id: fiscalConfigId },
        });
        if (!branch) {
            throw new common_1.NotFoundException('Sucursal no encontrada');
        }
        await this.warehouseRepository.delete({ billing_branch_id: id, tenant_id: tenantId });
        await this.branchRepository.remove(branch);
    }
    async findAllByTenant(tenantId) {
        const branches = await this.branchRepository
            .createQueryBuilder('branch')
            .innerJoinAndSelect('branch.fiscal_configuration', 'fc')
            .where('fc.tenant_id = :tenantId', { tenantId })
            .orderBy('branch.code', 'ASC')
            .getMany();
        return branches.map((branch) => ({
            ...branch,
            name: branch.code,
            display_name: `${branch.fiscal_configuration.rfc} - ${branch.code}`,
        }));
    }
    resolveBranchName(dto) {
        const name = (dto.name ?? dto.code ?? '').trim();
        if (!name) {
            throw new common_1.BadRequestException('El nombre de la sucursal es obligatorio');
        }
        return name;
    }
    async assertFiscalConfiguration(fiscalConfigId, tenantId) {
        const fiscalConfig = await this.fiscalConfigRepository.findOne({
            where: { id: fiscalConfigId, tenant_id: tenantId },
        });
        if (!fiscalConfig) {
            throw new common_1.NotFoundException('Razón social no encontrada');
        }
        return fiscalConfig;
    }
    async syncWarehouses(branchId, tenantId, warehouses) {
        const existing = await this.warehouseRepository.find({
            where: { billing_branch_id: branchId, tenant_id: tenantId },
        });
        const incomingIds = new Set(warehouses.filter((warehouse) => warehouse.id).map((warehouse) => warehouse.id));
        const toDelete = existing.filter((warehouse) => !incomingIds.has(warehouse.id));
        if (toDelete.length) {
            await this.warehouseRepository.remove(toDelete);
        }
        for (const item of warehouses) {
            if (item.id) {
                const warehouse = existing.find((existingWarehouse) => existingWarehouse.id === item.id);
                if (!warehouse) {
                    throw new common_1.BadRequestException('El almacén no pertenece a esta sucursal');
                }
                Object.assign(warehouse, this.toWarehouseUpdatePayload(item, branchId));
                await this.warehouseRepository.save(warehouse);
                continue;
            }
            if (!item.name?.trim()) {
                throw new common_1.BadRequestException('El nombre del almacén es obligatorio');
            }
            const created = this.warehouseRepository.create({
                ...this.toWarehouseCreatePayload(item, branchId),
                tenant_id: tenantId,
                name: item.name.trim(),
                status: item.status ?? 'active',
            });
            created.code = created.id || (0, crypto_1.randomUUID)();
            await this.warehouseRepository.save(created);
        }
    }
    toWarehouseCreatePayload(item, branchId) {
        const prefix = item.prefix !== undefined ? (0, document_prefix_util_1.normalizeDocumentPrefix)(item.prefix) : undefined;
        return {
            billing_branch_id: branchId,
            prefix,
            description: item.description,
            street: item.street,
            city: item.city,
            state: item.state,
            zip_code: item.zip_code,
            country: item.country,
            latitude: item.latitude ?? null,
            longitude: item.longitude ?? null,
            metadata: item.metadata,
        };
    }
    toWarehouseUpdatePayload(item, branchId) {
        const payload = {
            billing_branch_id: branchId,
        };
        if (item.name !== undefined)
            payload.name = item.name.trim();
        if (item.prefix !== undefined) {
            payload.prefix = (0, document_prefix_util_1.normalizeDocumentPrefix)(item.prefix);
        }
        if (item.description !== undefined)
            payload.description = item.description;
        if (item.street !== undefined)
            payload.street = item.street;
        if (item.city !== undefined)
            payload.city = item.city;
        if (item.state !== undefined)
            payload.state = item.state;
        if (item.zip_code !== undefined)
            payload.zip_code = item.zip_code;
        if (item.country !== undefined)
            payload.country = item.country;
        if (item.latitude !== undefined)
            payload.latitude = item.latitude;
        if (item.longitude !== undefined)
            payload.longitude = item.longitude;
        if (item.status !== undefined)
            payload.status = item.status;
        if (item.metadata !== undefined)
            payload.metadata = item.metadata;
        return payload;
    }
    toWarehouseResponse(warehouse) {
        return {
            id: warehouse.id,
            name: warehouse.name,
            code: warehouse.code,
            prefix: warehouse.prefix,
            description: warehouse.description,
            street: warehouse.street,
            city: warehouse.city,
            state: warehouse.state,
            zip_code: warehouse.zip_code,
            country: warehouse.country,
            latitude: warehouse.latitude != null ? Number(warehouse.latitude) : null,
            longitude: warehouse.longitude != null ? Number(warehouse.longitude) : null,
            status: warehouse.status,
            metadata: warehouse.metadata,
            created_at: warehouse.created_at,
            updated_at: warehouse.updated_at,
        };
    }
    toBranchDetailResponse(branch, warehouses) {
        const mappedWarehouses = warehouses.map((warehouse) => this.toWarehouseResponse(warehouse));
        return {
            ...branch,
            name: branch.code,
            warehouses: mappedWarehouses,
            warehouses_count: mappedWarehouses.length,
        };
    }
};
exports.BillingBranchService = BillingBranchService;
exports.BillingBranchService = BillingBranchService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(billing_branch_entity_1.BillingBranch)),
    __param(1, (0, typeorm_1.InjectRepository)(fiscal_configuration_entity_1.FiscalConfiguration)),
    __param(2, (0, typeorm_1.InjectRepository)(warehouse_entity_1.Warehouse)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], BillingBranchService);
//# sourceMappingURL=billing-branch.service.js.map