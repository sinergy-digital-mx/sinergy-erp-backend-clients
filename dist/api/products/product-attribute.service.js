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
exports.ProductAttributeService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const product_attribute_entity_1 = require("../../entities/products/product-attribute.entity");
const product_attribute_value_entity_1 = require("../../entities/products/product-attribute-value.entity");
let ProductAttributeService = class ProductAttributeService {
    attributeRepository;
    valueRepository;
    constructor(attributeRepository, valueRepository) {
        this.attributeRepository = attributeRepository;
        this.valueRepository = valueRepository;
    }
    async createAttribute(dto, tenantId) {
        const existing = await this.attributeRepository.findOne({
            where: { tenant_id: tenantId, name: dto.name },
        });
        if (existing) {
            throw new common_1.ConflictException(`Atributo "${dto.name}" ya existe`);
        }
        const attribute = this.attributeRepository.create({
            tenant_id: tenantId,
            name: dto.name,
            is_active: dto.is_active ?? true,
        });
        return this.attributeRepository.save(attribute);
    }
    async findOptions(tenantId) {
        const attributes = await this.attributeRepository.find({
            where: { tenant_id: tenantId, is_active: true },
            relations: ['values'],
            order: { name: 'ASC' },
        });
        return attributes.map((attribute) => ({
            id: attribute.id,
            name: attribute.name,
            values: (attribute.values ?? [])
                .filter((value) => value.is_active)
                .sort((a, b) => a.display_order - b.display_order || a.value.localeCompare(b.value))
                .map((value) => ({
                id: value.id,
                value: value.value,
                display_order: value.display_order,
            })),
        }));
    }
    async findAllAttributes(query, tenantId) {
        const { page = 1, limit = 20, search, is_active, include_values = false } = query;
        const skip = (page - 1) * limit;
        const where = { tenant_id: tenantId };
        if (search) {
            where.name = (0, typeorm_2.Like)(`%${search}%`);
        }
        if (is_active !== undefined) {
            where.is_active = is_active;
        }
        const [data, total] = await this.attributeRepository.findAndCount({
            where,
            relations: include_values ? ['values'] : [],
            order: { name: 'ASC' },
            skip,
            take: limit,
        });
        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async findAttributeById(id, tenantId) {
        const attribute = await this.attributeRepository.findOne({
            where: { id, tenant_id: tenantId },
            relations: ['values'],
        });
        if (!attribute) {
            throw new common_1.NotFoundException(`Atributo con ID ${id} no encontrado`);
        }
        return attribute;
    }
    async updateAttribute(id, dto, tenantId) {
        const attribute = await this.findAttributeById(id, tenantId);
        if (dto.name && dto.name !== attribute.name) {
            const existing = await this.attributeRepository.findOne({
                where: { tenant_id: tenantId, name: dto.name },
            });
            if (existing) {
                throw new common_1.ConflictException(`Atributo "${dto.name}" ya existe`);
            }
        }
        Object.assign(attribute, dto);
        return this.attributeRepository.save(attribute);
    }
    async removeAttribute(id, tenantId) {
        const attribute = await this.findAttributeById(id, tenantId);
        await this.attributeRepository.remove(attribute);
    }
    async createValue(attributeId, dto, tenantId) {
        const attribute = await this.findAttributeById(attributeId, tenantId);
        const existing = await this.valueRepository.findOne({
            where: { attribute_id: attributeId, value: dto.value },
        });
        if (existing) {
            throw new common_1.ConflictException(`Valor "${dto.value}" ya existe para este atributo`);
        }
        const value = this.valueRepository.create({
            attribute_id: attributeId,
            value: dto.value,
            display_order: dto.display_order ?? 0,
            is_active: dto.is_active ?? true,
            attribute,
        });
        return this.valueRepository.save(value);
    }
    async findAllValues(attributeId, tenantId) {
        await this.findAttributeById(attributeId, tenantId);
        return this.valueRepository.find({
            where: { attribute_id: attributeId },
            order: { display_order: 'ASC', value: 'ASC' },
        });
    }
    async findValueById(id, attributeId, tenantId) {
        await this.findAttributeById(attributeId, tenantId);
        const value = await this.valueRepository.findOne({
            where: { id, attribute_id: attributeId },
        });
        if (!value) {
            throw new common_1.NotFoundException(`Valor con ID ${id} no encontrado para este atributo`);
        }
        return value;
    }
    async updateValue(id, attributeId, dto, tenantId) {
        const value = await this.findValueById(id, attributeId, tenantId);
        if (dto.value && dto.value !== value.value) {
            const existing = await this.valueRepository.findOne({
                where: { attribute_id: attributeId, value: dto.value },
            });
            if (existing) {
                throw new common_1.ConflictException(`Valor "${dto.value}" ya existe para este atributo`);
            }
        }
        Object.assign(value, dto);
        return this.valueRepository.save(value);
    }
    async removeValue(id, attributeId, tenantId) {
        const value = await this.findValueById(id, attributeId, tenantId);
        await this.valueRepository.remove(value);
    }
};
exports.ProductAttributeService = ProductAttributeService;
exports.ProductAttributeService = ProductAttributeService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(product_attribute_entity_1.ProductAttribute)),
    __param(1, (0, typeorm_1.InjectRepository)(product_attribute_value_entity_1.ProductAttributeValue)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ProductAttributeService);
//# sourceMappingURL=product-attribute.service.js.map