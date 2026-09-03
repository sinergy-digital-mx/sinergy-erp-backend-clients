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
exports.PropertyGroupsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const property_group_entity_1 = require("../../entities/properties/property-group.entity");
const property_entity_1 = require("../../entities/properties/property.entity");
let PropertyGroupsService = class PropertyGroupsService {
    groupRepo;
    propertyRepo;
    constructor(groupRepo, propertyRepo) {
        this.groupRepo = groupRepo;
        this.propertyRepo = propertyRepo;
    }
    async create(tenantId, dto) {
        const group = this.groupRepo.create({
            ...dto,
            tenant_id: tenantId,
        });
        return await this.groupRepo.save(group);
    }
    async findAll(tenantId) {
        return await this.groupRepo.find({
            where: { tenant_id: tenantId },
            order: { created_at: 'DESC' },
        });
    }
    async findOne(tenantId, id) {
        return await this.groupRepo.findOne({
            where: { id, tenant_id: tenantId },
        });
    }
    async update(tenantId, id, dto) {
        const group = await this.findOne(tenantId, id);
        if (!group) {
            throw new common_1.NotFoundException(`Property group with ID ${id} not found`);
        }
        Object.assign(group, dto);
        return await this.groupRepo.save(group);
    }
    async remove(tenantId, id) {
        const group = await this.findOne(tenantId, id);
        if (!group) {
            throw new common_1.NotFoundException(`Property group with ID ${id} not found`);
        }
        await this.groupRepo.remove(group);
    }
    async getStats(tenantId, groupId) {
        const group = await this.findOne(tenantId, groupId);
        if (!group) {
            throw new common_1.NotFoundException(`Property group with ID ${groupId} not found`);
        }
        const stats = await this.propertyRepo
            .createQueryBuilder('p')
            .select('COUNT(*)', 'total')
            .addSelect("SUM(CASE WHEN p.status = 'disponible' THEN 1 ELSE 0 END)", 'available')
            .addSelect("SUM(CASE WHEN p.status = 'vendido' THEN 1 ELSE 0 END)", 'sold')
            .addSelect("SUM(CASE WHEN p.status = 'reservado' THEN 1 ELSE 0 END)", 'reserved')
            .addSelect("SUM(CASE WHEN p.status = 'cancelado' THEN 1 ELSE 0 END)", 'cancelled')
            .addSelect('SUM(p.total_price)', 'total_value')
            .addSelect('SUM(p.total_area)', 'total_area')
            .where('p.tenant_id = :tenantId', { tenantId })
            .andWhere('p.group_id = :groupId', { groupId })
            .getRawOne();
        return {
            group_id: groupId,
            total_properties: parseInt(stats.total) || 0,
            available_properties: parseInt(stats.available) || 0,
            sold_properties: parseInt(stats.sold) || 0,
            reserved_properties: parseInt(stats.reserved) || 0,
            cancelled_properties: parseInt(stats.cancelled) || 0,
            total_area: parseFloat(stats.total_area) || 0,
            total_value: parseFloat(stats.total_value) || 0,
        };
    }
};
exports.PropertyGroupsService = PropertyGroupsService;
exports.PropertyGroupsService = PropertyGroupsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(property_group_entity_1.PropertyGroup)),
    __param(1, (0, typeorm_1.InjectRepository)(property_entity_1.Property)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], PropertyGroupsService);
//# sourceMappingURL=property-groups.service.js.map