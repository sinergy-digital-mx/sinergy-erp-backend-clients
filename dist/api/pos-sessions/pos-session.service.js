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
exports.PosSessionService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const pos_session_entity_1 = require("../../entities/pos/pos-session.entity");
let PosSessionService = class PosSessionService {
    posSessionRepository;
    constructor(posSessionRepository) {
        this.posSessionRepository = posSessionRepository;
    }
    toNumeric(value) {
        const numeric = Number(value);
        return Number.isFinite(numeric) ? numeric : 0;
    }
    async openSession(dto, userId, tenantId) {
        const existingOpenSession = await this.posSessionRepository.findOne({
            where: {
                pos_configuration_id: dto.pos_configuration_id,
                tenant_id: tenantId,
                status: pos_session_entity_1.PosSessionStatus.OPEN,
            },
        });
        if (existingOpenSession) {
            throw new common_1.ConflictException(`Ya existe una sesión abierta para esta configuración de POS. Cierre primero la sesión ${existingOpenSession.session_number}.`);
        }
        const lastSession = await this.posSessionRepository.findOne({
            where: {
                pos_configuration_id: dto.pos_configuration_id,
                tenant_id: tenantId,
            },
            order: { session_number: 'DESC' },
        });
        const sessionNumber = lastSession ? lastSession.session_number + 1 : 1;
        const session = this.posSessionRepository.create({
            tenant_id: tenantId,
            pos_configuration_id: dto.pos_configuration_id,
            user_id: userId,
            session_number: sessionNumber,
            opening_cash: dto.opening_cash,
            status: pos_session_entity_1.PosSessionStatus.OPEN,
            notes: dto.notes,
            opened_at: new Date(),
        });
        return await this.posSessionRepository.save(session);
    }
    async closeSession(sessionId, dto, userId, tenantId) {
        const session = await this.posSessionRepository.findOne({
            where: { id: sessionId, tenant_id: tenantId },
        });
        if (!session) {
            throw new common_1.NotFoundException('Sesión no encontrada');
        }
        if (session.status !== pos_session_entity_1.PosSessionStatus.OPEN) {
            throw new common_1.BadRequestException('Solo se pueden cerrar sesiones abiertas');
        }
        const openingCash = this.toNumeric(session.opening_cash);
        const totalSales = this.toNumeric(session.total_sales);
        const closingCash = this.toNumeric(dto.closing_cash);
        const expectedCash = Number((openingCash + totalSales).toFixed(2));
        const cashDifference = Number((closingCash - expectedCash).toFixed(2));
        session.status = pos_session_entity_1.PosSessionStatus.CLOSED;
        session.closed_at = new Date();
        session.closing_cash = closingCash;
        session.expected_cash = expectedCash;
        session.cash_difference = cashDifference;
        session.closed_by = userId;
        if (dto.notes) {
            session.notes = session.notes
                ? `${session.notes}\n[Closing] ${dto.notes}`
                : dto.notes;
        }
        return await this.posSessionRepository.save(session);
    }
    async findAll(query, tenantId) {
        const { page = 1, limit = 10, sucursal, pos_configuration_id, user_id, status, from_date, to_date, } = query;
        const skip = (page - 1) * limit;
        const queryBuilder = this.posSessionRepository
            .createQueryBuilder('session')
            .leftJoinAndSelect('session.posConfiguration', 'posConfig')
            .leftJoinAndSelect('posConfig.branch', 'branch')
            .leftJoinAndSelect('session.user', 'user')
            .leftJoinAndSelect('session.closedByUser', 'closedBy')
            .where('session.tenant_id = :tenantId', { tenantId });
        if (sucursal) {
            queryBuilder.andWhere('posConfig.sucursal = :sucursal', { sucursal });
        }
        if (pos_configuration_id) {
            queryBuilder.andWhere('session.pos_configuration_id = :pos_configuration_id', {
                pos_configuration_id,
            });
        }
        if (user_id) {
            queryBuilder.andWhere('session.user_id = :user_id', { user_id });
        }
        if (status) {
            queryBuilder.andWhere('session.status = :status', { status });
        }
        if (from_date) {
            queryBuilder.andWhere('session.opened_at >= :from_date', { from_date });
        }
        if (to_date) {
            queryBuilder.andWhere('session.opened_at <= :to_date', { to_date });
        }
        const [data, total] = await queryBuilder
            .orderBy('session.opened_at', 'DESC')
            .skip(skip)
            .take(limit)
            .getManyAndCount();
        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async findOne(id, tenantId) {
        const session = await this.posSessionRepository.findOne({
            where: { id, tenant_id: tenantId },
            relations: ['posConfiguration', 'user', 'closedByUser'],
        });
        if (!session) {
            throw new common_1.NotFoundException('Sesión no encontrada');
        }
        return session;
    }
    async getCurrentOpenSession(posConfigurationId, tenantId) {
        return await this.posSessionRepository.findOne({
            where: {
                pos_configuration_id: posConfigurationId,
                tenant_id: tenantId,
                status: pos_session_entity_1.PosSessionStatus.OPEN,
            },
            relations: ['posConfiguration', 'user'],
        });
    }
    async updateSessionSales(sessionId, saleAmount, tenantId) {
        const session = await this.posSessionRepository.findOne({
            where: { id: sessionId, tenant_id: tenantId },
        });
        if (!session) {
            throw new common_1.NotFoundException('Sesión no encontrada');
        }
        session.total_sales = Number((this.toNumeric(session.total_sales) + this.toNumeric(saleAmount)).toFixed(2));
        session.total_transactions += 1;
        await this.posSessionRepository.save(session);
    }
};
exports.PosSessionService = PosSessionService;
exports.PosSessionService = PosSessionService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(pos_session_entity_1.PosSession)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], PosSessionService);
//# sourceMappingURL=pos-session.service.js.map