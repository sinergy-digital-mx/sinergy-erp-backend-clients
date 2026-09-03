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
exports.CustomerGroupsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const customer_group_entity_1 = require("../../entities/customers/customer-group.entity");
function assertOrganizationId(organizationId) {
    if (!organizationId) {
        throw new common_1.UnauthorizedException('El contexto de la organización es obligatorio');
    }
}
let CustomerGroupsService = class CustomerGroupsService {
    groupRepo;
    constructor(groupRepo) {
        this.groupRepo = groupRepo;
    }
    async create(dto, organizationId) {
        assertOrganizationId(organizationId);
        await this.assertUniqueName(organizationId, dto.name.trim());
        const group = this.groupRepo.create({
            name: dto.name.trim(),
            description: dto.description?.trim() || null,
            tenant_id: organizationId,
            is_system: false,
        });
        const saved = await this.groupRepo.save(group);
        return this.findOne(saved.id, organizationId);
    }
    async findAll(organizationId) {
        assertOrganizationId(organizationId);
        const groups = await this.groupRepo
            .createQueryBuilder('g')
            .where('g.tenant_id = :organizationId', { organizationId })
            .loadRelationCountAndMap('g.customerCount', 'g.customers')
            .orderBy('g.name', 'ASC')
            .getMany();
        return groups.map((g) => this.toGroupResponse(g));
    }
    async findOptions(organizationId) {
        assertOrganizationId(organizationId);
        const groups = await this.groupRepo.find({
            where: { tenant_id: organizationId },
            select: ['id', 'name'],
            order: { name: 'ASC' },
        });
        return groups.map((g) => ({ id: g.id, name: g.name }));
    }
    async findOne(id, organizationId) {
        assertOrganizationId(organizationId);
        const group = await this.groupRepo
            .createQueryBuilder('g')
            .where('g.id = :id', { id })
            .andWhere('g.tenant_id = :organizationId', { organizationId })
            .loadRelationCountAndMap('g.customerCount', 'g.customers')
            .getOne();
        if (!group) {
            throw new common_1.NotFoundException('El grupo no existe');
        }
        return this.toGroupResponse(group);
    }
    async update(id, dto, organizationId) {
        assertOrganizationId(organizationId);
        const group = await this.groupRepo.findOne({
            where: { id, tenant_id: organizationId },
        });
        if (!group) {
            throw new common_1.NotFoundException('El grupo no existe');
        }
        if (dto.name !== undefined) {
            await this.assertUniqueName(organizationId, dto.name.trim(), id);
            group.name = dto.name.trim();
        }
        if (dto.description !== undefined) {
            group.description = dto.description?.trim() || null;
        }
        await this.groupRepo.save(group);
        return this.findOne(id, organizationId);
    }
    async remove(id, organizationId) {
        assertOrganizationId(organizationId);
        const group = await this.groupRepo.findOne({
            where: { id, tenant_id: organizationId },
        });
        if (!group) {
            throw new common_1.NotFoundException('El grupo no existe');
        }
        if (group.is_system) {
            throw new common_1.BadRequestException('Este grupo no se puede eliminar porque está en uso por datos históricos');
        }
        const customerCount = await this.groupRepo
            .createQueryBuilder('g')
            .leftJoin('g.customers', 'c')
            .where('g.id = :id', { id })
            .andWhere('g.tenant_id = :organizationId', { organizationId })
            .select('COUNT(c.id)', 'count')
            .getRawOne();
        if (Number(customerCount?.count ?? 0) > 0) {
            throw new common_1.BadRequestException('No se puede eliminar el grupo porque tiene clientes asignados');
        }
        const propertyRows = await this.groupRepo.manager.query(`SELECT COUNT(*) AS count FROM properties WHERE group_id = ? AND tenant_id = ?`, [id, organizationId]);
        if (Number(propertyRows[0]?.count ?? 0) > 0) {
            throw new common_1.BadRequestException('No se puede eliminar el grupo porque tiene lotes asignados');
        }
        await this.groupRepo.delete({ id, tenant_id: organizationId });
        return { deleted: true };
    }
    async assertBelongsToOrganization(groupId, organizationId) {
        assertOrganizationId(organizationId);
        if (groupId === null || groupId === undefined || groupId === '') {
            return null;
        }
        const group = await this.groupRepo.findOne({
            where: { id: groupId, tenant_id: organizationId },
            select: ['id'],
        });
        if (!group) {
            throw new common_1.BadRequestException('group_id no es válido para esta organización');
        }
        return group.id;
    }
    async assertUniqueName(organizationId, name, excludeId) {
        const existing = await this.groupRepo.findOne({
            where: {
                tenant_id: organizationId,
                name,
                ...(excludeId ? { id: (0, typeorm_2.Not)(excludeId) } : {}),
            },
        });
        if (existing) {
            throw new common_1.ConflictException('Ya existe un grupo con ese nombre');
        }
    }
    toGroupResponse(g) {
        const customerCount = g.customerCount ?? 0;
        return {
            id: g.id,
            name: g.name,
            description: g.description ?? null,
            is_system: Boolean(g.is_system),
            customer_count: customerCount,
            created_at: g.created_at,
            updated_at: g.updated_at,
        };
    }
};
exports.CustomerGroupsService = CustomerGroupsService;
exports.CustomerGroupsService = CustomerGroupsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(customer_group_entity_1.CustomerGroup)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], CustomerGroupsService);
//# sourceMappingURL=customer-groups.service.js.map