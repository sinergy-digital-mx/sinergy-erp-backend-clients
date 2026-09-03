"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = __importStar(require("bcrypt"));
const user_status_entity_1 = require("../../entities/users/user-status.entity");
const tenant_entity_1 = require("../../entities/rbac/tenant.entity");
const user_entity_1 = require("../../entities/users/user.entity");
const user_billing_branch_entity_1 = require("../../entities/users/user-billing-branch.entity");
const billing_branch_entity_1 = require("../../entities/billing/billing-branch.entity");
const pos_user_type_enum_1 = require("../../entities/users/pos-user-type.enum");
const pos_daily_shift_entity_1 = require("../../entities/pos/pos-daily-shift.entity");
const pos_daily_shift_status_enum_1 = require("../../entities/pos/pos-daily-shift-status.enum");
const employees_service_1 = require("../employees/employees.service");
const user_manager_report_entity_1 = require("../../entities/users/user-manager-report.entity");
const user_warehouse_assignment_entity_1 = require("../../entities/control-desk/user-warehouse-assignment.entity");
const warehouse_entity_1 = require("../../entities/warehouse/warehouse.entity");
const user_status_constants_1 = require("./user-status.constants");
let UsersService = class UsersService {
    userRepo;
    tenantRepo;
    statusRepo;
    branchRepo;
    branchAssignmentRepo;
    dailyShiftRepo;
    managerReportRepo;
    warehouseAssignmentRepo;
    warehouseRepo;
    employeesService;
    constructor(userRepo, tenantRepo, statusRepo, branchRepo, branchAssignmentRepo, dailyShiftRepo, managerReportRepo, warehouseAssignmentRepo, warehouseRepo, employeesService) {
        this.userRepo = userRepo;
        this.tenantRepo = tenantRepo;
        this.statusRepo = statusRepo;
        this.branchRepo = branchRepo;
        this.branchAssignmentRepo = branchAssignmentRepo;
        this.dailyShiftRepo = dailyShiftRepo;
        this.managerReportRepo = managerReportRepo;
        this.warehouseAssignmentRepo = warehouseAssignmentRepo;
        this.warehouseRepo = warehouseRepo;
        this.employeesService = employeesService;
    }
    async create(dto, tenantId) {
        const status = await this.statusRepo.findOneByOrFail({ id: dto.status_id });
        const isPosUser = dto.is_pos_user ?? false;
        const assignment = this.resolveBranchAssignmentInput(dto) ?? {
            ids: dto.billing_branch_id ? [dto.billing_branch_id] : [],
            primary: dto.billing_branch_id ?? null,
            active: dto.billing_branch_id ?? null,
        };
        await this.validateBillingBranches(tenantId, assignment.ids);
        this.validateBranchAssignment(isPosUser, assignment.ids);
        this.validatePosUserType(isPosUser, dto.pos_user_type, dto.is_manager ?? false);
        await this.validatePosFields(tenantId, dto.pos_user_code);
        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const { is_pos_user, pos_user_code, billing_branch_id: _billing_branch_id, billing_branch_ids: _billing_branch_ids, primary_billing_branch_id: _primary_billing_branch_id, pos_user_type, is_employee, employee, is_manager, warehouse_ids, ...userFields } = dto;
        const user = await this.userRepo.save({
            ...userFields,
            password: hashedPassword,
            tenant: { id: tenantId },
            tenant_id: tenantId,
            status,
            permissions_version: 1,
            is_pos_user: isPosUser,
            pos_user_code: dto.pos_user_code ?? null,
            pos_user_type: isPosUser ? dto.pos_user_type ?? null : null,
            billing_branch_id: assignment.active,
            is_employee: false,
            is_manager: is_manager ?? false,
        });
        await this.replaceAssignedBranches(user.id, tenantId, assignment);
        if (dto.is_employee) {
            await this.employeesService.upsertForUser(tenantId, user.id, employee ?? {});
        }
        if (warehouse_ids) {
            await this.replaceAssignedWarehouses(user.id, tenantId, warehouse_ids);
        }
        const created = await this.findOne(user.id, tenantId);
        if (!created) {
            throw new common_1.NotFoundException('User not found after creation');
        }
        return created;
    }
    async update(id, dto, tenantId) {
        const user = await this.userRepo.findOneByOrFail({
            id,
            tenant_id: tenantId,
        });
        if (dto.status_id) {
            const status = await this.statusRepo.findOneByOrFail({ id: dto.status_id });
            user.status = status;
        }
        if (dto.password) {
            dto.password = await bcrypt.hash(dto.password, 10);
        }
        const nextIsPosUser = dto.is_pos_user ?? user.is_pos_user;
        const assignment = this.resolveBranchAssignmentInput(dto, user.billing_branch_id);
        const currentAssignedIds = assignment
            ? assignment.ids
            : await this.loadAssignedBranchIds(id, tenantId);
        const nextBillingBranchId = assignment
            ? assignment.active
            : user.billing_branch_id;
        const nextPosCode = dto.pos_user_code !== undefined ? dto.pos_user_code : user.pos_user_code;
        const nextPosUserType = dto.pos_user_type !== undefined ? dto.pos_user_type : user.pos_user_type;
        const nextIsManager = dto.is_manager ?? Boolean(user.is_manager);
        if (assignment) {
            await this.validateBillingBranches(tenantId, assignment.ids);
        }
        if (dto.is_pos_user !== undefined ||
            assignment !== undefined ||
            dto.pos_user_type !== undefined ||
            dto.is_manager !== undefined) {
            this.validateBranchAssignment(nextIsPosUser, currentAssignedIds);
            this.validatePosUserType(nextIsPosUser, nextPosUserType, nextIsManager);
        }
        if (dto.is_pos_user !== undefined || dto.pos_user_code !== undefined) {
            await this.validatePosFields(tenantId, nextPosCode, id);
        }
        await this.assertCobranzaConfigChangeAllowed(user, tenantId, nextIsPosUser, nextPosUserType, nextBillingBranchId);
        const { is_pos_user, pos_user_code, billing_branch_id: _billing_branch_id, billing_branch_ids: _billing_branch_ids, primary_billing_branch_id: _primary_billing_branch_id, pos_user_type, is_employee, employee, is_manager, warehouse_ids, ...userFields } = dto;
        if (dto.is_pos_user === true) {
            user.is_pos_user = true;
            if (dto.pos_user_type !== undefined) {
                user.pos_user_type = dto.pos_user_type;
            }
        }
        else if (dto.is_pos_user === false) {
            user.is_pos_user = false;
            user.pos_user_type = null;
        }
        else if (dto.pos_user_type !== undefined && user.is_pos_user) {
            user.pos_user_type = dto.pos_user_type;
        }
        if (dto.pos_user_code !== undefined) {
            user.pos_user_code = dto.pos_user_code;
        }
        if (assignment) {
            user.billing_branch_id = assignment.active;
            await this.replaceAssignedBranches(id, tenantId, assignment);
            if (warehouse_ids === undefined) {
                await this.dropWarehousesOutsideBranches(id, tenantId, assignment.ids);
            }
        }
        if (is_manager !== undefined) {
            user.is_manager = is_manager;
        }
        Object.assign(user, userFields);
        await this.userRepo.save(user);
        if (dto.is_employee === true) {
            await this.employeesService.upsertForUser(tenantId, id, employee ?? {});
        }
        else if (dto.is_employee === false) {
            await this.employeesService.setEmployeeFlag(tenantId, id, false);
        }
        else if (employee) {
            await this.employeesService.upsertForUser(tenantId, id, employee);
        }
        if (warehouse_ids) {
            await this.replaceAssignedWarehouses(id, tenantId, warehouse_ids);
        }
        const updated = await this.findOne(id, tenantId);
        if (!updated) {
            throw new common_1.NotFoundException('User not found after update');
        }
        return updated;
    }
    async changePassword(userId, dto, tenantId, currentUserId, canResetOthers = false) {
        if (userId !== currentUserId && !canResetOthers) {
            throw new common_1.ForbiddenException('No tienes permiso para cambiar la contraseña de otro usuario');
        }
        if (dto.new_password !== dto.confirm_password) {
            throw new common_1.BadRequestException('Las contraseñas no coinciden');
        }
        const user = await this.userRepo.findOneBy({
            id: userId,
            tenant_id: tenantId,
        });
        if (!user) {
            throw new common_1.NotFoundException('Usuario no encontrado');
        }
        user.password = await bcrypt.hash(dto.new_password, 10);
        await this.userRepo.save(user);
        return { message: 'Contraseña actualizada correctamente' };
    }
    async assignBranch(userId, tenantId, dto) {
        const user = await this.userRepo.findOneByOrFail({
            id: userId,
            tenant_id: tenantId,
        });
        const input = dto && typeof dto === 'object'
            ? dto
            : { billing_branch_id: dto ?? null };
        const assignment = this.resolveBranchAssignmentInput(input, user.billing_branch_id) ?? {
            ids: input.billing_branch_id ? [input.billing_branch_id] : [],
            primary: input.billing_branch_id ?? null,
            active: input.billing_branch_id ?? null,
        };
        await this.validateBillingBranches(tenantId, assignment.ids);
        this.validateBranchAssignment(user.is_pos_user, assignment.ids);
        await this.assertCobranzaConfigChangeAllowed(user, tenantId, Boolean(user.is_pos_user), user.pos_user_type, assignment.active);
        user.billing_branch_id = assignment.active;
        await this.userRepo.save(user);
        await this.replaceAssignedBranches(userId, tenantId, assignment);
        await this.dropWarehousesOutsideBranches(userId, tenantId, assignment.ids);
        const updated = await this.findOne(userId, tenantId);
        if (!updated) {
            throw new common_1.NotFoundException('User not found after branch assignment');
        }
        return this.mapUserBranchResponse(updated);
    }
    async setActiveBranch(userId, tenantId, billingBranchId) {
        const user = await this.userRepo.findOne({
            where: { id: userId, tenant_id: tenantId },
            relations: ['billing_branch', 'billing_branch.fiscal_configuration'],
        });
        if (!user) {
            throw new common_1.NotFoundException('Usuario no encontrado');
        }
        const assignedIds = await this.loadAssignedBranchIds(userId, tenantId);
        if (!assignedIds.includes(billingBranchId)) {
            throw new common_1.BadRequestException('La sucursal no está asignada a este usuario');
        }
        await this.validateBillingBranch(tenantId, billingBranchId);
        if (user.billing_branch_id !== billingBranchId) {
            await this.userRepo.update({ id: userId, tenant_id: tenantId }, { billing_branch_id: billingBranchId });
        }
        const updated = await this.findOne(userId, tenantId);
        if (!updated) {
            throw new common_1.NotFoundException('Usuario no encontrado');
        }
        return this.mapUserBranchResponse(updated);
    }
    async getUserBranch(userId, tenantId) {
        const user = await this.userRepo.findOne({
            where: { id: userId, tenant_id: tenantId },
            relations: ['billing_branch', 'billing_branch.fiscal_configuration'],
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return this.mapUserBranchResponse(user);
    }
    async findAllStatuses() {
        return this.statusRepo.find({ order: { id: 'ASC' } });
    }
    async findAll(tenantId, query) {
        const qb = this.userRepo
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.status', 'status')
            .leftJoinAndSelect('user.tenant', 'tenant')
            .leftJoinAndSelect('user.billing_branch', 'billing_branch')
            .leftJoinAndSelect('billing_branch.fiscal_configuration', 'fiscal_configuration')
            .where('user.tenant_id = :tenantId', { tenantId });
        if (query?.status_id) {
            qb.andWhere('user.status_id = :statusId', { statusId: query.status_id });
        }
        else {
            qb.andWhere('(status.code IS NULL OR LOWER(status.code) != :deletedCode)', { deletedCode: user_status_constants_1.USER_STATUS_CODE.DELETED });
        }
        if (query?.role_id) {
            qb.innerJoin('rbac_user_roles', 'ur', 'ur.user_id = user.id AND ur.tenant_id = :tenantId AND ur.role_id = :roleId', { tenantId, roleId: query.role_id });
        }
        const search = query?.search?.trim();
        if (search) {
            qb.andWhere('(user.email LIKE :q OR user.first_name LIKE :q OR user.last_name LIKE :q)', { q: `%${search}%` });
        }
        qb.orderBy('user.first_name', 'ASC').addOrderBy('user.email', 'ASC');
        const users = await qb.getMany();
        const managerByUserId = await this.getManagerByUserIdMap(tenantId);
        const warehousesByUserId = await this.getAssignedWarehousesByUserIdMap(tenantId, users.map((user) => user.id));
        const branchesByUserId = await this.getAssignedBranchesByUserIdMap(tenantId, users.map((user) => user.id));
        for (const user of users) {
            user.managerUser = managerByUserId.get(user.id) ?? null;
            user.assignedWarehouses = warehousesByUserId.get(user.id) ?? [];
            user.assignedBranches = branchesByUserId.get(user.id) ?? [];
        }
        return users;
    }
    async findOne(id, tenantId) {
        const user = await this.userRepo.findOne({
            where: { id, tenant_id: tenantId },
            relations: ['status', 'tenant', 'billing_branch', 'billing_branch.fiscal_configuration'],
        });
        if (!user) {
            return user;
        }
        if (user.is_employee) {
            const employee = await this.employeesService.findEntityByUser(tenantId, id);
            if (employee) {
                user.employeeProfile = await this.employeesService.mapEmployee(employee, { withRequests: false });
            }
        }
        const assignment = await this.managerReportRepo.findOne({
            where: { tenant_id: tenantId, report_user_id: id },
            relations: ['manager'],
        });
        user.managerUser = assignment?.manager ?? null;
        if (user.is_manager) {
            user.managedUsers = await this.loadManagedUsers(id, tenantId);
        }
        user.assignedWarehouses = await this.loadAssignedWarehouses(id, tenantId);
        user.assignedBranches = await this.loadAssignedBranches(id, tenantId);
        return user;
    }
    async getManagerReports(managerUserId, tenantId) {
        const manager = await this.userRepo.findOne({
            where: { id: managerUserId, tenant_id: tenantId },
        });
        if (!manager) {
            throw new common_1.NotFoundException('Usuario no encontrado');
        }
        const reports = await this.loadManagedUsers(managerUserId, tenantId);
        return {
            is_manager: Boolean(manager.is_manager),
            reports,
        };
    }
    async addManagerReport(managerUserId, reportUserId, tenantId) {
        const manager = await this.userRepo.findOne({
            where: { id: managerUserId, tenant_id: tenantId },
        });
        if (!manager) {
            throw new common_1.NotFoundException('Usuario no encontrado');
        }
        if (!manager.is_manager) {
            throw new common_1.BadRequestException('Activa la opción de gerente para asignar usuarios a cargo');
        }
        if (managerUserId === reportUserId) {
            throw new common_1.BadRequestException('Un gerente no puede asignarse a sí mismo');
        }
        const reportUser = await this.userRepo.findOne({
            where: { id: reportUserId, tenant_id: tenantId },
            relations: ['status'],
        });
        if (!reportUser) {
            throw new common_1.NotFoundException('El usuario no existe o no pertenece a esta organización');
        }
        const existing = await this.managerReportRepo.findOne({
            where: { tenant_id: tenantId, report_user_id: reportUserId },
        });
        if (existing) {
            if (existing.manager_user_id === managerUserId) {
                throw new common_1.ConflictException('Este usuario ya está a cargo de este gerente');
            }
            throw new common_1.ConflictException('Este usuario ya tiene un responsable asignado');
        }
        await this.managerReportRepo.save({
            tenant_id: tenantId,
            manager_user_id: managerUserId,
            report_user_id: reportUserId,
        });
        return this.mapManagedUser(reportUser);
    }
    async removeManagerReport(managerUserId, reportUserId, tenantId) {
        const assignment = await this.managerReportRepo.findOne({
            where: {
                tenant_id: tenantId,
                manager_user_id: managerUserId,
                report_user_id: reportUserId,
            },
        });
        if (!assignment) {
            throw new common_1.NotFoundException('El usuario no está a cargo de este gerente');
        }
        await this.managerReportRepo.remove(assignment);
    }
    async updateStatus(userId, tenantId, statusId, currentUserId) {
        const user = await this.userRepo.findOne({
            where: { id: userId, tenant_id: tenantId },
            relations: ['status'],
        });
        if (!user) {
            throw new common_1.NotFoundException('Usuario no encontrado');
        }
        const status = await this.statusRepo.findOneBy({ id: statusId });
        if (!status) {
            throw new common_1.BadRequestException('Estatus no válido');
        }
        if (userId === currentUserId && !(0, user_status_constants_1.isActiveUserStatus)(status.code)) {
            throw new common_1.ForbiddenException('No puedes desactivar o eliminar tu propia cuenta');
        }
        user.status = status;
        if (status.code?.toLowerCase() === user_status_constants_1.USER_STATUS_CODE.DELETED) {
            user.email = null;
        }
        await this.userRepo.save(user);
        const updated = await this.findOne(userId, tenantId);
        if (!updated) {
            throw new common_1.NotFoundException('Usuario no encontrado');
        }
        return updated;
    }
    async softDelete(userId, tenantId, currentUserId) {
        if (userId === currentUserId) {
            throw new common_1.ForbiddenException('No puedes eliminar tu propia cuenta');
        }
        const deleted = await this.statusRepo.findOne({
            where: { code: user_status_constants_1.USER_STATUS_CODE.DELETED },
        });
        if (!deleted) {
            throw new common_1.BadRequestException('Estatus eliminado no está configurado');
        }
        const user = await this.userRepo.findOne({
            where: { id: userId, tenant_id: tenantId },
            relations: ['status'],
        });
        if (!user) {
            throw new common_1.NotFoundException('Usuario no encontrado');
        }
        if (user.status?.code?.toLowerCase() === user_status_constants_1.USER_STATUS_CODE.DELETED) {
            throw new common_1.BadRequestException('El usuario ya está eliminado');
        }
        return this.updateStatus(userId, tenantId, deleted.id, currentUserId);
    }
    mapUserResponse(user) {
        return {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            phone: user.phone,
            status_id: user.status?.id ?? null,
            status: user.status,
            language_code: user.language_code,
            last_login_at: user.last_login_at,
            created_at: user.created_at,
            is_pos_user: Boolean(user.is_pos_user),
            pos_user_type: user.pos_user_type,
            pos_user_code: user.pos_user_code,
            pos_can_sell: Boolean(user.is_pos_user) && (0, pos_user_type_enum_1.canPosSell)(user.pos_user_type),
            pos_can_collect: Boolean(user.is_pos_user) && (0, pos_user_type_enum_1.canPosCollect)(user.pos_user_type),
            is_employee: Boolean(user.is_employee),
            employee: user.employeeProfile ?? null,
            is_manager: Boolean(user.is_manager),
            manager: this.mapManagerSummary(user.managerUser),
            ...(user.managedUsers
                ? { reports: user.managedUsers }
                : {}),
            ...this.mapUserBranchResponse(user),
            assigned_warehouses: user.assignedWarehouses ?? [],
        };
    }
    async getAssignedWarehouses(userId, tenantId) {
        const user = await this.userRepo.findOne({
            where: { id: userId, tenant_id: tenantId },
        });
        if (!user) {
            throw new common_1.NotFoundException('Usuario no encontrado');
        }
        return {
            assigned_warehouses: await this.loadAssignedWarehouses(userId, tenantId),
        };
    }
    async replaceAssignedWarehouses(userId, tenantId, warehouseIds) {
        const user = await this.userRepo.findOne({
            where: { id: userId, tenant_id: tenantId },
        });
        if (!user) {
            throw new common_1.NotFoundException('Usuario no encontrado');
        }
        const uniqueIds = [...new Set(warehouseIds)];
        const assignedBranchIds = await this.loadAssignedBranchIds(userId, tenantId);
        await this.assertWarehousesForUser(tenantId, assignedBranchIds, uniqueIds);
        await this.warehouseAssignmentRepo.delete({
            tenant_id: tenantId,
            user_id: userId,
        });
        if (uniqueIds.length) {
            await this.warehouseAssignmentRepo.save(uniqueIds.map((warehouseId) => this.warehouseAssignmentRepo.create({
                tenant_id: tenantId,
                user_id: userId,
                warehouse_id: warehouseId,
            })));
        }
        return this.getAssignedWarehouses(userId, tenantId);
    }
    mapUserBranchResponse(user) {
        const assigned = user.assignedBranches ?? [];
        const primary = assigned.find((row) => row.is_primary) ?? assigned[0] ?? null;
        return {
            billing_branch_id: user.billing_branch_id,
            billing_branch: user.billing_branch
                ? this.mapBillingBranch(user.billing_branch)
                : null,
            fiscal_configuration_id: user.billing_branch?.fiscal_configuration_id ?? null,
            primary_billing_branch_id: primary?.id ?? user.billing_branch_id ?? null,
            assigned_branches: assigned,
            can_switch_branch: assigned.length > 1,
            has_all_branches_access: assigned.length === 0 && user.billing_branch_id == null,
        };
    }
    async loadAssignedWarehouses(userId, tenantId) {
        const rows = await this.warehouseAssignmentRepo.find({
            where: { tenant_id: tenantId, user_id: userId },
            relations: ['warehouse', 'warehouse.billing_branch'],
            order: { created_at: 'ASC' },
        });
        return rows.filter((row) => row.warehouse).map((row) => this.mapWarehouse(row.warehouse));
    }
    async getAssignedWarehousesByUserIdMap(tenantId, userIds) {
        const map = new Map();
        if (!userIds.length) {
            return map;
        }
        const rows = await this.warehouseAssignmentRepo.find({
            where: { tenant_id: tenantId, user_id: (0, typeorm_2.In)(userIds) },
            relations: ['warehouse', 'warehouse.billing_branch'],
        });
        for (const row of rows) {
            if (!row.warehouse) {
                continue;
            }
            const list = map.get(row.user_id) ?? [];
            list.push(this.mapWarehouse(row.warehouse));
            map.set(row.user_id, list);
        }
        return map;
    }
    async assertWarehousesForUser(tenantId, assignedBranchIds, warehouseIds) {
        if (!warehouseIds.length) {
            return;
        }
        const warehouses = await this.warehouseRepo.find({
            where: warehouseIds.map((id) => ({ id, tenant_id: tenantId })),
        });
        if (warehouses.length !== warehouseIds.length) {
            throw new common_1.BadRequestException('Uno o más almacenes no existen o no pertenecen a la organización');
        }
        if (assignedBranchIds.length) {
            const allowed = new Set(assignedBranchIds);
            const outside = warehouses.filter((warehouse) => !warehouse.billing_branch_id ||
                !allowed.has(warehouse.billing_branch_id));
            if (outside.length) {
                throw new common_1.BadRequestException('El almacén debe pertenecer a una sucursal asignada al usuario');
            }
        }
    }
    async dropWarehousesOutsideBranches(userId, tenantId, assignedBranchIds) {
        if (!assignedBranchIds.length) {
            return;
        }
        const allowed = new Set(assignedBranchIds);
        const rows = await this.warehouseAssignmentRepo.find({
            where: { tenant_id: tenantId, user_id: userId },
            relations: ['warehouse', 'warehouse.billing_branch'],
        });
        const toRemove = rows.filter((row) => !row.warehouse?.billing_branch_id ||
            !allowed.has(row.warehouse.billing_branch_id));
        if (toRemove.length) {
            await this.warehouseAssignmentRepo.remove(toRemove);
        }
    }
    mapWarehouse(warehouse) {
        const branch = warehouse.billing_branch;
        return {
            id: warehouse.id,
            name: warehouse.name,
            code: warehouse.code,
            billing_branch_id: warehouse.billing_branch_id,
            billing_branch: branch
                ? {
                    id: branch.id,
                    code: branch.code,
                    display_name: [branch.code, branch.city].filter(Boolean).join(' — '),
                }
                : null,
        };
    }
    mapBillingBranch(branch) {
        return {
            id: branch.id,
            code: branch.code,
            address: branch.address,
            city: branch.city,
            state: branch.state,
            country: branch.country,
            postal_code: branch.postal_code,
            fiscal_configuration_id: branch.fiscal_configuration_id,
            fiscal_configuration: branch.fiscal_configuration
                ? {
                    id: branch.fiscal_configuration.id,
                    razon_social: branch.fiscal_configuration.razon_social,
                    rfc: branch.fiscal_configuration.rfc,
                }
                : null,
        };
    }
    validatePosUserType(isPosUser, posUserType, isManager = false) {
        if (!isPosUser) {
            if (posUserType) {
                throw new common_1.BadRequestException('pos_user_type solo aplica cuando el usuario es de tipo POS');
            }
            return;
        }
        if (!posUserType) {
            throw new common_1.BadRequestException('pos_user_type es requerido cuando is_pos_user es true (VENTAS, COBRANZA o AMBOS)');
        }
        if (posUserType === pos_user_type_enum_1.PosUserType.AMBOS && !isManager) {
            throw new common_1.BadRequestException('Solo un gerente puede tener POS de ventas y cobranza (AMBOS)');
        }
    }
    validateBranchAssignment(isPosUser, assignedBranchIds) {
        if (isPosUser && assignedBranchIds.length === 0) {
            throw new common_1.BadRequestException('Los usuarios POS deben tener al menos una sucursal asignada');
        }
    }
    async assertCobranzaConfigChangeAllowed(user, tenantId, nextIsPosUser, nextPosUserType, nextBillingBranchId) {
        if (!(0, pos_user_type_enum_1.canPosCollect)(user.pos_user_type)) {
            return;
        }
        const hasOpenShift = await this.hasOpenDailyShift(user.id, tenantId);
        if (!hasOpenShift) {
            return;
        }
        const configChanging = nextIsPosUser !== Boolean(user.is_pos_user) ||
            nextPosUserType !== user.pos_user_type ||
            nextBillingBranchId !== user.billing_branch_id;
        if (configChanging) {
            throw new common_1.BadRequestException('No se puede cambiar el tipo POS ni la sucursal mientras hay un corte global abierto. Cierra el corte primero.');
        }
    }
    async hasOpenDailyShift(terminalUserId, tenantId) {
        const shiftDate = new Date().toISOString().slice(0, 10);
        const count = await this.dailyShiftRepo.count({
            where: {
                tenant_id: tenantId,
                terminal_user_id: terminalUserId,
                shift_date: shiftDate,
                status: pos_daily_shift_status_enum_1.PosDailyShiftStatus.OPEN,
            },
        });
        return count > 0;
    }
    resolveBranchAssignmentInput(dto, currentActive) {
        if (dto.billing_branch_ids === undefined &&
            dto.billing_branch_id === undefined &&
            dto.primary_billing_branch_id === undefined) {
            return undefined;
        }
        let ids;
        if (dto.billing_branch_ids !== undefined) {
            ids = [...new Set(dto.billing_branch_ids.filter((id) => !!id))];
        }
        else if (dto.billing_branch_id) {
            ids = [dto.billing_branch_id];
        }
        else {
            ids = [];
        }
        const requestedPrimary = dto.primary_billing_branch_id ?? dto.billing_branch_id ?? null;
        const primary = (requestedPrimary && ids.includes(requestedPrimary)
            ? requestedPrimary
            : null) ??
            ids[0] ??
            null;
        const active = (currentActive && ids.includes(currentActive) ? currentActive : null) ??
            primary;
        if (ids.length > 0 && dto.primary_billing_branch_id && !primary) {
            throw new common_1.BadRequestException('La sucursal principal debe estar en las sucursales asignadas');
        }
        return { ids, primary, active };
    }
    async replaceAssignedBranches(userId, tenantId, assignment) {
        await this.branchAssignmentRepo.delete({
            tenant_id: tenantId,
            user_id: userId,
        });
        if (!assignment.ids.length) {
            return;
        }
        await this.branchAssignmentRepo.save(assignment.ids.map((billingBranchId) => this.branchAssignmentRepo.create({
            tenant_id: tenantId,
            user_id: userId,
            billing_branch_id: billingBranchId,
            is_primary: billingBranchId === assignment.primary,
        })));
    }
    async loadAssignedBranchIds(userId, tenantId) {
        const rows = await this.branchAssignmentRepo.find({
            where: { tenant_id: tenantId, user_id: userId },
        });
        return rows.map((row) => row.billing_branch_id);
    }
    async loadAssignedBranches(userId, tenantId) {
        const rows = await this.branchAssignmentRepo.find({
            where: { tenant_id: tenantId, user_id: userId },
            relations: ['billing_branch', 'billing_branch.fiscal_configuration'],
            order: { created_at: 'ASC' },
        });
        return rows
            .filter((row) => row.billing_branch)
            .sort((a, b) => Number(b.is_primary) - Number(a.is_primary))
            .map((row) => this.mapAssignedBranch(row));
    }
    async getAssignedBranchesByUserIdMap(tenantId, userIds) {
        const map = new Map();
        if (!userIds.length) {
            return map;
        }
        const rows = await this.branchAssignmentRepo.find({
            where: { tenant_id: tenantId, user_id: (0, typeorm_2.In)(userIds) },
            relations: ['billing_branch', 'billing_branch.fiscal_configuration'],
        });
        for (const row of rows) {
            if (!row.billing_branch) {
                continue;
            }
            const list = map.get(row.user_id) ?? [];
            list.push(this.mapAssignedBranch(row));
            map.set(row.user_id, list);
        }
        for (const [userId, list] of map) {
            list.sort((a, b) => Number(b.is_primary) - Number(a.is_primary));
            map.set(userId, list);
        }
        return map;
    }
    mapAssignedBranch(row) {
        const branch = row.billing_branch;
        return {
            id: branch.id,
            code: branch.code,
            address: branch.address,
            city: branch.city,
            state: branch.state,
            display_name: [branch.code, branch.city].filter(Boolean).join(' — '),
            name: [branch.code, branch.city].filter(Boolean).join(' — '),
            is_primary: Boolean(row.is_primary),
            fiscal_configuration_id: branch.fiscal_configuration_id,
            fiscal_configuration: branch.fiscal_configuration
                ? {
                    id: branch.fiscal_configuration.id,
                    razon_social: branch.fiscal_configuration.razon_social,
                    rfc: branch.fiscal_configuration.rfc,
                }
                : null,
        };
    }
    async validateBillingBranches(tenantId, billingBranchIds) {
        for (const billingBranchId of billingBranchIds) {
            await this.validateBillingBranch(tenantId, billingBranchId);
        }
    }
    async validateBillingBranch(tenantId, billingBranchId) {
        if (!billingBranchId) {
            return;
        }
        const branch = await this.branchRepo
            .createQueryBuilder('branch')
            .innerJoin('branch.fiscal_configuration', 'fc')
            .where('branch.id = :billingBranchId', { billingBranchId })
            .andWhere('fc.tenant_id = :tenantId', { tenantId })
            .getOne();
        if (!branch) {
            throw new common_1.NotFoundException('La sucursal no existe o no pertenece al tenant');
        }
    }
    async validatePosFields(tenantId, posUserCode, excludeUserId) {
        if (posUserCode == null) {
            return;
        }
        const query = this.userRepo
            .createQueryBuilder('user')
            .where('user.tenant_id = :tenantId', { tenantId })
            .andWhere('user.pos_user_code = :posUserCode', { posUserCode });
        if (excludeUserId) {
            query.andWhere('user.id != :excludeUserId', { excludeUserId });
        }
        const existing = await query.getOne();
        if (existing) {
            throw new common_1.ConflictException(`El código ${posUserCode} ya está asignado a otro usuario`);
        }
    }
    async getManagerByUserIdMap(tenantId) {
        const assignments = await this.managerReportRepo.find({
            where: { tenant_id: tenantId },
            relations: ['manager'],
        });
        return new Map(assignments.map((row) => [row.report_user_id, row.manager]));
    }
    async loadManagedUsers(managerUserId, tenantId) {
        const rows = await this.managerReportRepo.find({
            where: { tenant_id: tenantId, manager_user_id: managerUserId },
            relations: ['report', 'report.status'],
            order: { created_at: 'ASC' },
        });
        return rows.map((row) => this.mapManagedUser(row.report));
    }
    mapManagedUser(user) {
        return {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            phone: user.phone,
            status: user.status,
        };
    }
    mapManagerSummary(manager) {
        if (!manager) {
            return null;
        }
        return {
            id: manager.id,
            email: manager.email,
            first_name: manager.first_name,
            last_name: manager.last_name,
        };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(tenant_entity_1.RBACTenant)),
    __param(2, (0, typeorm_1.InjectRepository)(user_status_entity_1.UserStatus)),
    __param(3, (0, typeorm_1.InjectRepository)(billing_branch_entity_1.BillingBranch)),
    __param(4, (0, typeorm_1.InjectRepository)(user_billing_branch_entity_1.UserBillingBranch)),
    __param(5, (0, typeorm_1.InjectRepository)(pos_daily_shift_entity_1.PosDailyShift)),
    __param(6, (0, typeorm_1.InjectRepository)(user_manager_report_entity_1.UserManagerReport)),
    __param(7, (0, typeorm_1.InjectRepository)(user_warehouse_assignment_entity_1.UserWarehouseAssignment)),
    __param(8, (0, typeorm_1.InjectRepository)(warehouse_entity_1.Warehouse)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        employees_service_1.EmployeesService])
], UsersService);
//# sourceMappingURL=users.service.js.map