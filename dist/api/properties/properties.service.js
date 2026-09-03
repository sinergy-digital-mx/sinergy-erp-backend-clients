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
exports.PropertiesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const property_entity_1 = require("../../entities/properties/property.entity");
const measurement_unit_entity_1 = require("../../entities/properties/measurement-unit.entity");
const customer_groups_service_1 = require("../customers/customer-groups.service");
const property_pricing_util_1 = require("./utils/property-pricing.util");
const contract_currency_util_1 = require("../contracts/contract-currency.util");
let PropertiesService = class PropertiesService {
    propertyRepo;
    measurementUnitRepo;
    customerGroupsService;
    constructor(propertyRepo, measurementUnitRepo, customerGroupsService) {
        this.propertyRepo = propertyRepo;
        this.measurementUnitRepo = measurementUnitRepo;
        this.customerGroupsService = customerGroupsService;
    }
    async create(tenantId, dto) {
        await this.assertPropertyCodeAvailable(tenantId, dto.code);
        const groupId = await this.customerGroupsService.assertBelongsToOrganization(dto.group_id, tenantId);
        if (!groupId) {
            throw new common_1.BadRequestException('group_id es obligatorio');
        }
        const pricing = this.resolvePricing({
            totalArea: dto.total_area,
            totalPrice: dto.total_price,
            pricePerM2: dto.price_per_m2,
            isCreate: true,
        });
        const property = this.propertyRepo.create({
            ...dto,
            group_id: groupId,
            tenant_id: tenantId,
            currency: (0, contract_currency_util_1.normalizeContractCurrency)(dto.currency, contract_currency_util_1.DEFAULT_CONTRACT_CURRENCY),
            cadastral_key: this.normalizeOptionalText(dto.cadastral_key),
            total_price: pricing.total_price,
            price_per_m2: pricing.price_per_m2,
        });
        let saved;
        try {
            saved = await this.propertyRepo.save(property);
        }
        catch (err) {
            this.rethrowIfDuplicatePropertyCode(err, dto.code);
            throw err;
        }
        return this.presentProperty(saved);
    }
    async findAll(tenantId, filters = {}, page = 1, limit = 20) {
        if (page < 1)
            page = 1;
        if (limit < 1)
            limit = 1;
        if (limit > 100)
            limit = 100;
        const skip = (page - 1) * limit;
        const query = this.propertyRepo
            .createQueryBuilder('p')
            .leftJoinAndSelect('p.group', 'g')
            .leftJoinAndSelect('p.measurement_unit', 'mu')
            .leftJoinAndSelect('p.contracts', 'contracts')
            .leftJoinAndSelect('contracts.customer', 'customer')
            .leftJoinAndSelect('customer.group', 'customerGroup')
            .where('p.tenant_id = :tenantId', { tenantId });
        this.applyPropertyListFilters(query, filters);
        const total = await query.getCount();
        const properties = await query
            .orderBy('p.code', 'ASC')
            .skip(skip)
            .take(limit)
            .getMany();
        const data = properties.map(property => {
            let relevantContract = property.contracts && property.contracts.length > 0
                ? (property.contracts.find(c => c.status === 'activo') ||
                    property.contracts.find(c => c.status === 'completado') ||
                    property.contracts[0])
                : null;
            const customer = relevantContract?.customer;
            return {
                ...property,
                customer: customer ? {
                    id: customer.id,
                    name: customer.name,
                    lastname: customer.lastname,
                    fullName: `${customer.name} ${customer.lastname}`.trim(),
                    group_id: customer.group_id ?? null,
                    group: customer.group
                        ? { id: customer.group.id, name: customer.group.name }
                        : null,
                } : null,
                contracts: property.contracts,
                ...this.pricingFields(property),
                currency: (0, contract_currency_util_1.resolveStoredContractCurrency)(property.currency),
            };
        });
        const totalPages = Math.ceil(total / limit);
        return {
            data,
            total,
            page,
            limit,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        };
    }
    async findOne(tenantId, id) {
        const property = await this.propertyRepo
            .createQueryBuilder('p')
            .leftJoinAndSelect('p.group', 'g')
            .leftJoinAndSelect('p.measurement_unit', 'mu')
            .leftJoinAndSelect('p.contracts', 'contracts', 'contracts.status = :contractStatus', { contractStatus: 'activo' })
            .leftJoinAndSelect('contracts.customer', 'customer')
            .where('p.id = :id', { id })
            .andWhere('p.tenant_id = :tenantId', { tenantId })
            .getOne();
        return property ? this.presentProperty(property) : null;
    }
    async findByCode(tenantId, code) {
        const property = await this.propertyRepo.findOne({
            where: { code, tenant_id: tenantId },
            relations: ['group', 'measurement_unit'],
        });
        return property ? this.presentProperty(property) : null;
    }
    async update(tenantId, id, dto) {
        const property = await this.findOne(tenantId, id);
        if (!property) {
            throw new Error('Property not found');
        }
        if (dto.code !== undefined && dto.code !== property.code) {
            await this.assertPropertyCodeAvailable(tenantId, dto.code, property.id);
        }
        if (dto.group_id !== undefined) {
            const groupId = await this.customerGroupsService.assertBelongsToOrganization(dto.group_id, tenantId);
            if (!groupId) {
                throw new common_1.BadRequestException('group_id es obligatorio');
            }
            dto = { ...dto, group_id: groupId };
        }
        const existingTotalPrice = Number(property.total_price);
        const existingPricePerM2 = property.price_per_m2 != null ? Number(property.price_per_m2) : null;
        const pricingTouched = dto.total_area !== undefined ||
            dto.total_price !== undefined ||
            dto.price_per_m2 !== undefined;
        Object.assign(property, dto);
        if (dto.cadastral_key !== undefined) {
            property.cadastral_key = this.normalizeOptionalText(dto.cadastral_key);
        }
        if (dto.currency !== undefined) {
            property.currency = (0, contract_currency_util_1.normalizeContractCurrency)(dto.currency);
        }
        if (pricingTouched) {
            const pricing = this.resolvePricing({
                totalArea: dto.total_area ?? Number(property.total_area),
                totalPrice: dto.total_price,
                pricePerM2: dto.price_per_m2,
                existingTotalPrice,
                existingPricePerM2,
            });
            property.total_price = pricing.total_price;
            property.price_per_m2 = pricing.price_per_m2;
        }
        let updated;
        try {
            updated = await this.propertyRepo.save(property);
        }
        catch (err) {
            if (dto.code !== undefined) {
                this.rethrowIfDuplicatePropertyCode(err, dto.code);
            }
            throw err;
        }
        return this.presentProperty(updated);
    }
    async remove(tenantId, id) {
        const property = await this.findOne(tenantId, id);
        if (!property) {
            throw new Error('Property not found');
        }
        await this.propertyRepo.remove(property);
    }
    async getListStats(tenantId, filters = {}) {
        const totalsQuery = this.propertyRepo
            .createQueryBuilder('p')
            .where('p.tenant_id = :tenantId', { tenantId });
        this.applyPropertyListFilters(totalsQuery, filters);
        const totals = await totalsQuery
            .select('COUNT(DISTINCT p.id)', 'count')
            .addSelect('COALESCE(SUM(p.total_area), 0)', 'area')
            .addSelect('COALESCE(SUM(p.total_price), 0)', 'value')
            .addSelect("COALESCE(SUM(CASE WHEN p.status = 'disponible' THEN 1 ELSE 0 END), 0)", 'available_count')
            .addSelect("COALESCE(SUM(CASE WHEN p.status = 'disponible' THEN p.total_area ELSE 0 END), 0)", 'available_area')
            .addSelect("COALESCE(SUM(CASE WHEN p.status = 'disponible' THEN p.total_price ELSE 0 END), 0)", 'available_value')
            .addSelect("COALESCE(SUM(CASE WHEN p.status = 'reservado' THEN 1 ELSE 0 END), 0)", 'reserved_count')
            .addSelect("COALESCE(SUM(CASE WHEN p.status = 'vendido' THEN 1 ELSE 0 END), 0)", 'sold_count')
            .getRawOne();
        const activeQuery = this.propertyRepo
            .createQueryBuilder('p')
            .innerJoin('p.contracts', 'ac', "ac.status = 'activo'")
            .where('p.tenant_id = :tenantId', { tenantId });
        this.applyPropertyListFilters(activeQuery, filters);
        const active = await activeQuery
            .select('COUNT(DISTINCT p.id)', 'count')
            .addSelect('COALESCE(SUM(ac.remaining_balance), 0)', 'remaining_balance')
            .getRawOne();
        const area = (0, property_pricing_util_1.roundMoney)(parseFloat(totals?.area) || 0);
        const value = (0, property_pricing_util_1.roundMoney)(parseFloat(totals?.value) || 0);
        const currencyQuery = this.propertyRepo
            .createQueryBuilder('p')
            .where('p.tenant_id = :tenantId', { tenantId });
        this.applyPropertyListFilters(currencyQuery, filters);
        const currencyRows = await currencyQuery
            .select('UPPER(TRIM(p.currency))', 'currency')
            .distinct(true)
            .getRawMany();
        const currencies = Array.from(new Set(currencyRows
            .map((row) => (0, contract_currency_util_1.resolveStoredContractCurrency)(row.currency))
            .filter(Boolean)));
        const displayCurrencies = currencies.length > 0 ? currencies : [contract_currency_util_1.DEFAULT_CONTRACT_CURRENCY];
        return {
            currency: displayCurrencies.length === 1 ? displayCurrencies[0] : null,
            currencies: displayCurrencies,
            total: {
                count: parseInt(totals?.count, 10) || 0,
                area,
                value,
            },
            available: {
                count: parseInt(totals?.available_count, 10) || 0,
                area: (0, property_pricing_util_1.roundMoney)(parseFloat(totals?.available_area) || 0),
                value: (0, property_pricing_util_1.roundMoney)(parseFloat(totals?.available_value) || 0),
            },
            active_in_payment: {
                count: parseInt(active?.count, 10) || 0,
                remaining_balance: (0, property_pricing_util_1.roundMoney)(parseFloat(active?.remaining_balance) || 0),
            },
            reserved: {
                count: parseInt(totals?.reserved_count, 10) || 0,
            },
            sold: {
                count: parseInt(totals?.sold_count, 10) || 0,
            },
            avg_price_per_m2: area > 0 ? (0, property_pricing_util_1.roundMoney)(value / area) : 0,
        };
    }
    applyPropertyListFilters(query, filters) {
        if (filters.group_id) {
            query.andWhere('p.group_id = :group_id', { group_id: filters.group_id });
        }
        if (filters.status) {
            query.andWhere('p.status = :status', { status: filters.status });
        }
        if (filters.search) {
            query.andWhere(`(
          LOWER(p.code) LIKE LOWER(:search)
          OR LOWER(p.name) LIKE LOWER(:search)
          OR LOWER(p.block) LIKE LOWER(:search)
          OR LOWER(p.lot_number) LIKE LOWER(:search)
          OR LOWER(p.cadastral_key) LIKE LOWER(:search)
          OR LOWER(p.location) LIKE LOWER(:search)
          OR LOWER(p.description) LIKE LOWER(:search)
          OR EXISTS (
            SELECT 1 FROM contracts s_c
            INNER JOIN customers s_cust ON s_cust.id = s_c.customer_id
            WHERE s_c.property_id = p.id
              AND (
                LOWER(s_cust.name) LIKE LOWER(:search)
                OR LOWER(s_cust.lastname) LIKE LOWER(:search)
                OR LOWER(CONCAT(s_cust.name, ' ', s_cust.lastname)) LIKE LOWER(:search)
              )
          )
        )`, { search: `%${filters.search}%` });
        }
    }
    resolvePricing(params) {
        try {
            return (0, property_pricing_util_1.resolvePropertyPricing)(params);
        }
        catch (err) {
            if (err instanceof property_pricing_util_1.PropertyPricingError) {
                throw new common_1.BadRequestException(err.message);
            }
            throw err;
        }
    }
    pricingFields(property) {
        const totalPrice = Number(property.total_price);
        const storedUnit = property.price_per_m2 != null ? Number(property.price_per_m2) : null;
        return {
            total_price: Number.isFinite(totalPrice) ? totalPrice : 0,
            price_per_m2: storedUnit != null && Number.isFinite(storedUnit)
                ? storedUnit
                : (0, property_pricing_util_1.derivePricePerM2)(property.total_price, property.total_area),
        };
    }
    presentProperty(property) {
        const pricing = this.pricingFields(property);
        property.total_price = pricing.total_price;
        property.price_per_m2 = pricing.price_per_m2;
        property.currency = (0, contract_currency_util_1.resolveStoredContractCurrency)(property.currency);
        return property;
    }
    async getMeasurementUnits() {
        return this.measurementUnitRepo.find({
            order: { system: 'ASC', name: 'ASC' },
        });
    }
    normalizeOptionalText(value) {
        if (value == null) {
            return null;
        }
        const trimmed = value.trim();
        return trimmed === '' ? null : trimmed;
    }
    async assertPropertyCodeAvailable(tenantId, code, excludePropertyId) {
        const existing = await this.propertyRepo.findOne({
            where: { tenant_id: tenantId, code },
        });
        if (existing && existing.id !== excludePropertyId) {
            throw new common_1.ConflictException(`Ya existe una propiedad con el código "${code}".`);
        }
    }
    rethrowIfDuplicatePropertyCode(err, code) {
        if (!(err instanceof typeorm_2.QueryFailedError)) {
            return;
        }
        const driverErr = err.driverError;
        const isDup = driverErr?.code === 'ER_DUP_ENTRY' ||
            driverErr?.errno === 1062 ||
            /Duplicate entry/i.test(err.message);
        if (!isDup) {
            return;
        }
        const detail = driverErr?.sqlMessage ?? err.message;
        throw new common_1.ConflictException({
            statusCode: 409,
            message: `Ya existe una propiedad con el código "${code}".`,
            error: 'Conflict',
            detail,
        });
    }
};
exports.PropertiesService = PropertiesService;
exports.PropertiesService = PropertiesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(property_entity_1.Property)),
    __param(1, (0, typeorm_1.InjectRepository)(measurement_unit_entity_1.MeasurementUnit)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        customer_groups_service_1.CustomerGroupsService])
], PropertiesService);
//# sourceMappingURL=properties.service.js.map