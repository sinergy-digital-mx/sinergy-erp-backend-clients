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
exports.CustomerAssignmentService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const uuid_1 = require("uuid");
const customer_entity_1 = require("../../../entities/customers/customer.entity");
const customer_assignment_change_entity_1 = require("../../../entities/customers/customer-assignment-change.entity");
const assignment_change_util_1 = require("../../../common/utils/assignment-change.util");
let CustomerAssignmentService = class CustomerAssignmentService {
    changeRepo;
    customerRepo;
    constructor(changeRepo, customerRepo) {
        this.changeRepo = changeRepo;
        this.customerRepo = customerRepo;
    }
    async record(input) {
        if (!input.changes.length) {
            return;
        }
        const type = input.type ?? 'assignment_updated';
        const activity = this.changeRepo.create({
            id: (0, uuid_1.v4)(),
            tenant_id: input.tenantId,
            customer_id: input.customerId,
            type,
            title: assignment_change_util_1.ASSIGNMENT_TYPE_LABELS[type] ?? 'Cambio de asignación',
            description: (0, assignment_change_util_1.buildAssignmentDescription)(input.changes),
            actor_id: input.actorId,
            occurred_at: input.occurredAt ?? new Date(),
            changes: input.changes,
        });
        await this.changeRepo.save(activity);
    }
    async listForCustomer(customerId, tenantId) {
        const customer = await this.customerRepo.findOne({
            where: { id: customerId, tenant_id: tenantId },
            select: ['id'],
        });
        if (!customer) {
            throw new common_1.NotFoundException('Cliente no encontrado');
        }
        return this.listForExistingCustomer(customerId, tenantId);
    }
    async listForExistingCustomer(customerId, tenantId) {
        await this.seedCurrentAssignmentIfEmpty(customerId, tenantId);
        const rows = await this.changeRepo.find({
            where: { customer_id: customerId, tenant_id: tenantId },
            relations: ['actor'],
            order: { occurred_at: 'DESC', created_at: 'DESC' },
            take: 100,
        });
        return rows.map((row) => this.mapRow(row));
    }
    async seedCurrentAssignmentIfEmpty(customerId, tenantId) {
        const existing = await this.changeRepo.count({
            where: { customer_id: customerId, tenant_id: tenantId },
        });
        if (existing > 0) {
            return;
        }
        const customer = await this.customerRepo
            .createQueryBuilder('customer')
            .leftJoin('customer.registered_fiscal_configuration', 'fiscal')
            .addSelect(['fiscal.id', 'fiscal.razon_social'])
            .leftJoinAndSelect('customer.registered_billing_branch', 'branch')
            .leftJoin('customer.assigned_seller_user', 'seller')
            .addSelect([
            'seller.id',
            'seller.first_name',
            'seller.last_name',
            'seller.email',
            'seller.pos_user_code',
        ])
            .where('customer.id = :customerId', { customerId })
            .andWhere('customer.tenant_id = :tenantId', { tenantId })
            .getOne();
        if (!customer) {
            return;
        }
        const changes = (0, assignment_change_util_1.compactAssignmentChanges)([
            (0, assignment_change_util_1.assignmentChange)('registered_fiscal_configuration_id', 'Razón social de registro', null, customer.registered_fiscal_configuration?.razon_social ?? null, null, customer.registered_fiscal_configuration_id),
            (0, assignment_change_util_1.assignmentChange)('registered_billing_branch_id', 'Sucursal de registro', null, customer.registered_billing_branch?.code ?? null, null, customer.registered_billing_branch_id),
            (0, assignment_change_util_1.assignmentChange)('assigned_seller_user_id', 'Vendedor asignado', null, (0, assignment_change_util_1.formatAssignmentUserLabel)(customer.assigned_seller_user), null, customer.assigned_seller_user_id),
        ]);
        if (!changes.length) {
            return;
        }
        await this.record({
            tenantId,
            customerId,
            actorId: customer.registered_by_user_id,
            type: 'assignment_initialized',
            changes,
            occurredAt: customer.created_at,
        });
    }
    mapRow(row) {
        return {
            id: row.id,
            type: row.type,
            type_label: assignment_change_util_1.ASSIGNMENT_TYPE_LABELS[row.type] ?? row.title,
            title: row.title,
            description: row.description,
            actor_id: row.actor_id,
            actor_name: (0, assignment_change_util_1.mapAssignmentActorName)(row.actor),
            occurred_at: row.occurred_at,
            changes: row.changes ?? [],
        };
    }
};
exports.CustomerAssignmentService = CustomerAssignmentService;
exports.CustomerAssignmentService = CustomerAssignmentService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(customer_assignment_change_entity_1.CustomerAssignmentChange)),
    __param(1, (0, typeorm_1.InjectRepository)(customer_entity_1.Customer)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], CustomerAssignmentService);
//# sourceMappingURL=customer-assignment.service.js.map