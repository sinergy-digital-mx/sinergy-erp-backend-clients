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
exports.GlobalDiscountService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const global_discount_entity_1 = require("../../entities/global-discounts/global-discount.entity");
const global_discount_util_1 = require("./utils/global-discount.util");
let GlobalDiscountService = class GlobalDiscountService {
    globalDiscountRepository;
    constructor(globalDiscountRepository) {
        this.globalDiscountRepository = globalDiscountRepository;
    }
    validateDiscountValue(discountType, value) {
        if (value <= 0) {
            throw new common_1.BadRequestException('El valor del descuento debe ser mayor a 0');
        }
        if (discountType === global_discount_entity_1.GlobalDiscountType.PERCENTAGE && value > 100) {
            throw new common_1.BadRequestException('El porcentaje de descuento no puede ser mayor a 100');
        }
    }
    validateDateRange(validFrom, validTo) {
        if (validFrom && validTo && new Date(validFrom) > new Date(validTo)) {
            throw new common_1.BadRequestException('valid_from debe ser anterior o igual a valid_to');
        }
    }
    async create(dto, tenantId) {
        this.validateDiscountValue(dto.discount_type, dto.value);
        this.validateDateRange(dto.valid_from, dto.valid_to);
        const existing = await this.globalDiscountRepository.findOne({
            where: { tenant_id: tenantId, name: dto.name.trim() },
        });
        if (existing) {
            throw new common_1.ConflictException('Ya existe un descuento global con ese nombre');
        }
        const discount = this.globalDiscountRepository.create({
            ...dto,
            name: dto.name.trim(),
            tenant_id: tenantId,
            valid_from: dto.valid_from ? new Date(dto.valid_from) : null,
            valid_to: dto.valid_to ? new Date(dto.valid_to) : null,
        });
        return this.globalDiscountRepository.save(discount);
    }
    async findAll(tenantId) {
        return this.globalDiscountRepository.find({
            where: { tenant_id: tenantId },
            order: { created_at: 'ASC' },
        });
    }
    async findApplicable(tenantId) {
        const discounts = await this.findAll(tenantId);
        return discounts
            .filter((discount) => (0, global_discount_util_1.isGlobalDiscountApplicable)(discount))
            .map(global_discount_util_1.mapApplicableGlobalDiscount);
    }
    async findOne(id, tenantId) {
        const discount = await this.globalDiscountRepository.findOne({
            where: { id, tenant_id: tenantId },
        });
        if (!discount) {
            throw new common_1.NotFoundException(`Descuento global con ID ${id} no encontrado`);
        }
        return discount;
    }
    async findByIdForOrder(id, tenantId) {
        return this.findOne(id, tenantId);
    }
    async update(id, dto, tenantId) {
        const discount = await this.findOne(id, tenantId);
        const nextType = dto.discount_type ?? discount.discount_type;
        const nextValue = dto.value ?? Number(discount.value);
        this.validateDiscountValue(nextType, nextValue);
        this.validateDateRange(dto.valid_from ?? (discount.valid_from ? discount.valid_from.toISOString().slice(0, 10) : null), dto.valid_to ?? (discount.valid_to ? discount.valid_to.toISOString().slice(0, 10) : null));
        if (dto.name && dto.name.trim() !== discount.name) {
            const duplicate = await this.globalDiscountRepository.findOne({
                where: { tenant_id: tenantId, name: dto.name.trim() },
            });
            if (duplicate && duplicate.id !== id) {
                throw new common_1.ConflictException('Ya existe un descuento global con ese nombre');
            }
        }
        Object.assign(discount, {
            ...dto,
            name: dto.name?.trim() ?? discount.name,
            valid_from: dto.valid_from !== undefined
                ? dto.valid_from
                    ? new Date(dto.valid_from)
                    : null
                : discount.valid_from,
            valid_to: dto.valid_to !== undefined
                ? dto.valid_to
                    ? new Date(dto.valid_to)
                    : null
                : discount.valid_to,
        });
        return this.globalDiscountRepository.save(discount);
    }
    async remove(id, tenantId) {
        const discount = await this.findOne(id, tenantId);
        await this.globalDiscountRepository.remove(discount);
    }
};
exports.GlobalDiscountService = GlobalDiscountService;
exports.GlobalDiscountService = GlobalDiscountService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(global_discount_entity_1.GlobalDiscount)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], GlobalDiscountService);
//# sourceMappingURL=global-discount.service.js.map