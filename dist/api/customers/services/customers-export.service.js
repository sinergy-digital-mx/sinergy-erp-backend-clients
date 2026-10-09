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
exports.CustomersExportService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const customer_entity_1 = require("../../../entities/customers/customer.entity");
const customer_credit_entity_1 = require("../../../entities/customers/customer-credit.entity");
const excel_export_util_1 = require("../../../common/utils/excel-export.util");
const customer_list_insight_util_1 = require("../utils/customer-list-insight.util");
let CustomersExportService = class CustomersExportService {
    customerRepo;
    creditRepo;
    columns = [
        { header: 'ID', key: 'id', width: 8, type: 'integer' },
        { header: 'Nombre', key: 'name', width: 18 },
        { header: 'Apellido', key: 'lastname', width: 18 },
        { header: 'Empresa', key: 'company_name', width: 24 },
        { header: 'Email', key: 'email', width: 26 },
        { header: 'Teléfono', key: 'phone', width: 16 },
        { header: 'Estatus', key: 'status_name', width: 14 },
        { header: 'Grupo', key: 'group_name', width: 18 },
        { header: 'Razón asignada', key: 'registered_razon_social', width: 28 },
        { header: 'RFC razón asignada', key: 'registered_rfc', width: 18 },
        { header: 'RFC', key: 'fiscal_rfc', width: 16 },
        { header: 'Razón social', key: 'fiscal_razon_social', width: 26 },
        { header: 'Almacén', key: 'warehouse_name', width: 20 },
        { header: 'Crédito activo', key: 'credit_enabled', width: 14 },
        { header: 'Crédito por razón social', key: 'credit_by_fiscal', width: 40 },
        { header: 'Generar factura', key: 'auto_generate_invoice', width: 16 },
        { header: 'Fecha creación', key: 'created_at', width: 18, type: 'date' },
    ];
    constructor(customerRepo, creditRepo) {
        this.customerRepo = customerRepo;
        this.creditRepo = creditRepo;
    }
    async exportCustomers(tenantId, filters) {
        const customers = await this.fetchCustomers(tenantId, filters);
        const creditByCustomer = await this.loadCreditSummaries(tenantId, customers.map((c) => c.id));
        const rows = customers.map((c) => {
            const credit = creditByCustomer.get(c.id);
            return {
                id: c.id,
                name: c.name ?? '',
                lastname: c.lastname ?? '',
                company_name: c.company_name ?? '',
                email: c.email ?? '',
                phone: this.formatPhone(c.phone_code, c.phone),
                status_name: c.status?.name ?? '',
                group_name: c.group?.name ?? '',
                registered_razon_social: c.registered_fiscal_configuration?.razon_social ?? '',
                registered_rfc: c.registered_fiscal_configuration?.rfc ?? '',
                fiscal_rfc: c.fiscal_rfc ?? '',
                fiscal_razon_social: c.fiscal_razon_social ?? '',
                warehouse_name: c.warehouse?.name ?? '',
                credit_enabled: credit?.enabled ? 'Sí' : 'No',
                credit_by_fiscal: credit?.detail ?? '',
                auto_generate_invoice: c.auto_generate_invoice ? 'Sí' : 'No',
                created_at: (0, excel_export_util_1.formatExportDateTime)(c.created_at),
            };
        });
        return (0, excel_export_util_1.buildStyledExcelBuffer)({
            sheetName: 'Clientes',
            title: 'Reporte de clientes',
            subtitle: (0, excel_export_util_1.buildExportSubtitle)([
                `Generado: ${(0, excel_export_util_1.formatExportDateTime)(new Date())}`,
                `Registros: ${rows.length}`,
                this.describeFilters(filters),
            ]),
            columns: this.columns,
            rows,
            headerColor: 'FFC47B2B',
            titleColor: 'FFA05E1A',
        });
    }
    getFilename() {
        return `clientes-${new Date().toISOString().slice(0, 10)}.xlsx`;
    }
    async loadCreditSummaries(tenantId, customerIds) {
        const result = new Map();
        if (customerIds.length === 0) {
            return result;
        }
        const rows = await this.creditRepo.find({
            where: { tenant_id: tenantId, customer_id: (0, typeorm_2.In)(customerIds), credit_enabled: true },
            relations: ['fiscal_configuration'],
        });
        const grouped = new Map();
        for (const row of rows) {
            const label = `${row.fiscal_configuration?.razon_social ?? row.fiscal_configuration_id}: $${Number(row.credit_amount ?? 0).toFixed(2)} (${row.credit_days ?? 0}d)`;
            const list = grouped.get(row.customer_id) ?? [];
            list.push(label);
            grouped.set(row.customer_id, list);
        }
        for (const id of customerIds) {
            const detail = grouped.get(id) ?? [];
            result.set(id, {
                enabled: detail.length > 0,
                detail: detail.join('; '),
            });
        }
        return result;
    }
    async fetchCustomers(tenantId, query) {
        const qb = this.customerRepo
            .createQueryBuilder('customer')
            .leftJoinAndSelect('customer.status', 'status')
            .leftJoinAndSelect('customer.group', 'group', 'group.tenant_id = customer.tenant_id')
            .leftJoinAndSelect('customer.warehouse', 'warehouse')
            .leftJoin('customer.registered_fiscal_configuration', 'registeredFiscal')
            .addSelect(['registeredFiscal.id', 'registeredFiscal.razon_social', 'registeredFiscal.rfc'])
            .leftJoin('customer.contracts', 'contracts')
            .leftJoin('contracts.property', 'property')
            .where('customer.tenant_id = :tenantId', { tenantId });
        (0, customer_list_insight_util_1.applyCustomerDirectoryFilters)(qb, query);
        qb.orderBy('customer.created_at', 'DESC');
        return qb.getMany();
    }
    formatPhone(code, phone) {
        if (!phone)
            return '';
        if (code)
            return `+${code} ${phone}`;
        return phone;
    }
    describeFilters(filters) {
        const parts = [];
        if (filters.search)
            parts.push(`Búsqueda: ${filters.search}`);
        if (filters.status_id)
            parts.push(`Estatus ID: ${filters.status_id}`);
        if (filters.group_id)
            parts.push('Grupo filtrado');
        if (filters.registered_fiscal_configuration_id)
            parts.push('Razón social asignada');
        if ((0, customer_list_insight_util_1.isCustomerListInsight)(filters.insight)) {
            parts.push((0, customer_list_insight_util_1.customerInsightLabel)(filters.insight));
        }
        return parts.join(' | ');
    }
};
exports.CustomersExportService = CustomersExportService;
exports.CustomersExportService = CustomersExportService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(customer_entity_1.Customer)),
    __param(1, (0, typeorm_1.InjectRepository)(customer_credit_entity_1.CustomerCredit)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], CustomersExportService);
//# sourceMappingURL=customers-export.service.js.map