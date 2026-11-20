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
exports.ContractMonthlyIncomeService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const contract_entity_1 = require("../../entities/contracts/contract.entity");
const contract_monthly_income_util_1 = require("./utils/contract-monthly-income.util");
let ContractMonthlyIncomeService = class ContractMonthlyIncomeService {
    contractRepo;
    constructor(contractRepo) {
        this.contractRepo = contractRepo;
    }
    async getMonthlyIncome(tenantId, query) {
        const [payments, unscheduled] = await Promise.all([
            this.loadPayments(tenantId, query),
            this.loadUnscheduled(tenantId, query),
        ]);
        return (0, contract_monthly_income_util_1.buildMonthlyIncomeAnalysis)({
            year: query.year,
            month: query.month,
            payments,
            unscheduled,
        });
    }
    monthRange(query) {
        const start = `${query.year}-${String(query.month).padStart(2, '0')}-01`;
        const lastDay = new Date(Date.UTC(query.year, query.month, 0)).getUTCDate();
        const end = `${query.year}-${String(query.month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        return { start, end };
    }
    async loadPayments(tenantId, query) {
        const { start, end } = this.monthRange(query);
        const params = [tenantId, start, end, start];
        let groupClause = '';
        if (query.group_id) {
            groupClause = 'AND (cu.group_id = ? OR pr.group_id = ?)';
            params.push(query.group_id, query.group_id);
        }
        return this.contractRepo.manager.query(`
      SELECT
        c.id AS contract_id,
        c.contract_number,
        c.currency,
        TRIM(CONCAT(COALESCE(cu.name, ''), ' ', COALESCE(cu.lastname, ''))) AS customer_name,
        DATE_FORMAT(p.due_date, '%Y-%m-%d') AS due_date,
        p.amount,
        p.amount_paid,
        p.status
      FROM contract_payments p
      INNER JOIN contracts c ON c.id = p.contract_id
      LEFT JOIN customers cu ON cu.id = c.customer_id
      LEFT JOIN properties pr ON pr.id = c.property_id
      WHERE c.tenant_id = ?
        AND c.status IN ('activo', 'completado', 'suspendido')
        AND p.status <> 'cancelado'
        AND (
          (p.due_date >= ? AND p.due_date <= ?)
          OR (p.due_date < ? AND p.status IN ('pendiente', 'parcial'))
        )
        ${groupClause}
      `, params);
    }
    async loadUnscheduled(tenantId, query) {
        const { start, end } = this.monthRange(query);
        const params = [tenantId, start, end];
        let groupClause = '';
        if (query.group_id) {
            groupClause = 'AND (cu.group_id = ? OR pr.group_id = ?)';
            params.push(query.group_id, query.group_id);
        }
        return this.contractRepo.manager.query(`
      SELECT
        c.id AS contract_id,
        c.contract_number,
        c.currency,
        c.monthly_payment,
        TRIM(CONCAT(COALESCE(cu.name, ''), ' ', COALESCE(cu.lastname, ''))) AS customer_name
      FROM contracts c
      LEFT JOIN customers cu ON cu.id = c.customer_id
      LEFT JOIN properties pr ON pr.id = c.property_id
      WHERE c.tenant_id = ?
        AND c.status = 'activo'
        AND c.sale_type = 'financed'
        AND c.monthly_payment > 0
        AND c.remaining_balance > 0
        AND NOT EXISTS (
          SELECT 1
          FROM contract_payments p
          WHERE p.contract_id = c.id
            AND p.status <> 'cancelado'
            AND p.due_date >= ?
            AND p.due_date <= ?
        )
        ${groupClause}
      ORDER BY c.contract_number ASC
      `, params);
    }
};
exports.ContractMonthlyIncomeService = ContractMonthlyIncomeService;
exports.ContractMonthlyIncomeService = ContractMonthlyIncomeService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(contract_entity_1.Contract)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ContractMonthlyIncomeService);
//# sourceMappingURL=contract-monthly-income.service.js.map