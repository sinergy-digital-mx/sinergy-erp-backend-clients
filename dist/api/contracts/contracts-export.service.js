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
exports.ContractsExportService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const ExcelJS = __importStar(require("exceljs"));
const contract_entity_1 = require("../../entities/contracts/contract.entity");
const contract_list_filters_util_1 = require("./contract-list-filters.util");
const contract_list_insight_util_1 = require("./contract-list-insight.util");
const contract_financial_util_1 = require("./contract-financial.util");
let ContractsExportService = class ContractsExportService {
    contractRepo;
    constructor(contractRepo) {
        this.contractRepo = contractRepo;
    }
    async exportToExcel(tenantId, filters = {}) {
        const query = this.contractRepo
            .createQueryBuilder('c')
            .where('c.tenant_id = :tenantId', { tenantId });
        (0, contract_list_filters_util_1.joinContractFilterRelations)(query, { select: true });
        (0, contract_list_filters_util_1.applyContractListFilters)(query, filters);
        const contracts = await query
            .orderBy('CASE WHEN c.status = :activeStatus AND c.id NOT IN (SELECT DISTINCT contract_id FROM contract_payments WHERE is_overdue = true) THEN 0 WHEN c.status = :activeStatus THEN 1 WHEN c.status = :completedStatus THEN 2 ELSE 3 END', 'ASC')
            .addOrderBy('(SELECT COUNT(*) FROM contract_payments WHERE contract_id = c.id AND payment_date < CURDATE() AND status IN (:...statuses))', 'DESC')
            .addOrderBy('c.contract_date', 'DESC')
            .setParameter('activeStatus', 'activo')
            .setParameter('completedStatus', 'completado')
            .setParameter('statuses', ['pendiente', 'parcial'])
            .getMany();
        const stats = await this.calculateFilteredStats(tenantId, filters);
        const contractIds = contracts.map((c) => c.id);
        const paidPaymentMap = new Map();
        const paymentInsight = await (0, contract_list_insight_util_1.loadListPaymentInsightMaps)(this.contractRepo.manager, tenantId, contractIds);
        if (contractIds.length > 0) {
            const paidPayments = await this.contractRepo.manager.query(`
        SELECT
          contract_id,
          COUNT(*) as paid_count,
          SUM(amount) as total_paid
        FROM contract_payments
        WHERE contract_id IN (${contractIds.map(() => '?').join(',')})
          AND tenant_id = ?
          AND status = 'pagado'
        GROUP BY contract_id
        `, [...contractIds, tenantId]);
            paidPayments.forEach((row) => {
                paidPaymentMap.set(row.contract_id, {
                    paid_count: row.paid_count || 0,
                    total_paid: Number(row.total_paid) || 0,
                });
            });
        }
        const excelData = contracts.map((contract) => {
            const totalPrice = Number(contract.total_price) || 0;
            const downPayment = Number(contract.down_payment) || 0;
            const financedAmount = totalPrice - downPayment;
            const paidInfo = paidPaymentMap.get(contract.id) || { paid_count: 0, total_paid: 0 };
            const insight = (0, contract_list_insight_util_1.resolveListPaymentInsight)({
                downPaymentFinanced: !!contract.down_payment_financed,
                unpaidDownPaymentCount: paymentInsight.unpaidDownCount.get(contract.id) || 0,
                downPaymentApplied: (0, contract_financial_util_1.getDownPaymentApplied)(contract),
                downPaymentTarget: contract.down_payment_target != null
                    ? Number(contract.down_payment_target)
                    : null,
                contractNext: paymentInsight.contractNext.get(contract.id) || null,
                downPaymentNext: paymentInsight.downPaymentNext.get(contract.id) || null,
            });
            const nextKindLabel = insight.next_payment_kind === 'down_payment'
                ? 'Enganche'
                : insight.next_payment_kind === 'contract'
                    ? 'Contrato'
                    : 'N/A';
            return {
                'Número Contrato': contract.contract_number,
                'Cliente': `${contract.customer?.name || ''} ${contract.customer?.lastname || ''}`.trim(),
                'Lote': contract.property?.code || '',
                'Fecha Inicio': this.formatDate(contract.contract_date),
                'Moneda': (contract.currency || 'USD').toString().trim().toUpperCase() || 'USD',
                'Fase': insight.payment_phase === 'down_payment' ? 'Enganche' : 'Contrato',
                'Precio Total': totalPrice,
                'Enganche': downPayment,
                'Monto Financiado': financedAmount,
                'Saldo Pendiente': Number(contract.remaining_balance) || 0,
                'Meses Pagados': paidInfo.paid_count,
                'Monto Pagado': paidInfo.total_paid,
                'Próximo Pago': insight.next_payment?.due_date
                    ? this.formatDate(insight.next_payment.due_date)
                    : 'N/A',
                'Tipo Próximo Pago': nextKindLabel,
                'Monto Próximo Pago': insight.next_payment?.amount ?? 'N/A',
                'Último Enganche': insight.next_payment_is_last_down_payment ? 'Sí' : 'No',
                'Estado': contract.status,
                'Pagos Vencidos': paymentInsight.overdueContractCount.get(contract.id) || 0,
                'Vencidos Enganche': paymentInsight.overdueDownCount.get(contract.id) || 0,
            };
        });
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Contratos');
        const headerRow = worksheet.addRow(Object.keys(excelData[0] || {
            'Número Contrato': '',
            'Cliente': '',
            'Lote': '',
            'Fecha Inicio': '',
            'Moneda': '',
            'Fase': '',
            'Precio Total': '',
            'Enganche': '',
            'Monto Financiado': '',
            'Saldo Pendiente': '',
            'Meses Pagados': '',
            'Monto Pagado': '',
            'Próximo Pago': '',
            'Tipo Próximo Pago': '',
            'Monto Próximo Pago': '',
            'Último Enganche': '',
            'Estado': '',
            'Pagos Vencidos': '',
            'Vencidos Enganche': '',
        }));
        headerRow.eachCell((cell) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF4B5A8A' },
            };
            cell.font = {
                bold: true,
                color: { argb: 'FFFFFFFF' },
                size: 11,
            };
            cell.alignment = {
                horizontal: 'center',
                vertical: 'middle',
                wrapText: true,
            };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } },
            };
        });
        excelData.forEach((data, index) => {
            const row = worksheet.addRow(Object.values(data));
            const isEvenRow = index % 2 === 0;
            row.eachCell((cell, colNumber) => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: isEvenRow ? 'FFFFFFFF' : 'FFF5F5F5' },
                };
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
                    left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
                    bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
                    right: { style: 'thin', color: { argb: 'FFE0E0E0' } },
                };
                if ([1, 2, 3, 4, 5, 6, 13, 14, 16, 17].includes(colNumber)) {
                    cell.alignment = { horizontal: 'left', vertical: 'middle' };
                }
                else {
                    cell.alignment = { horizontal: 'right', vertical: 'middle' };
                }
                if ([7, 8, 9, 10, 12, 15].includes(colNumber)) {
                    if (typeof cell.value === 'number') {
                        cell.numFmt = '$#,##0.00';
                    }
                }
            });
        });
        worksheet.columns = [
            { width: 15 },
            { width: 25 },
            { width: 12 },
            { width: 15 },
            { width: 10 },
            { width: 12 },
            { width: 14 },
            { width: 14 },
            { width: 16 },
            { width: 16 },
            { width: 14 },
            { width: 14 },
            { width: 15 },
            { width: 16 },
            { width: 18 },
            { width: 16 },
            { width: 12 },
            { width: 14 },
            { width: 16 },
        ];
        worksheet.views = [{ state: 'frozen', ySplit: 1 }];
        const statsStartColumn = 22;
        const statsStartRow = 2;
        const titleCell = worksheet.getCell(statsStartRow, statsStartColumn);
        titleCell.value = 'RESUMEN';
        titleCell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
        titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4B5A8A' } };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.mergeCells(statsStartRow, statsStartColumn, statsStartRow, statsStartColumn + 1);
        let currentRow = statsStartRow + 2;
        this.addStatRow(worksheet, currentRow, statsStartColumn, 'TOTAL', stats.total.count, stats.total.value);
        currentRow += 2;
        this.addStatRow(worksheet, currentRow, statsStartColumn, 'COMPLETADOS', stats.completed.count, stats.completed.value);
        currentRow += 2;
        this.addStatRowWithDetails(worksheet, currentRow, statsStartColumn, 'ACTIVOS', stats.pending.count, stats.pending.value, { label: 'Pagado:', value: stats.pending.paid }, { label: 'Pendiente:', value: stats.pending.remaining });
        currentRow += 4;
        this.addStatRowWithDetails(worksheet, currentRow, statsStartColumn, 'VENCIDOS', stats.overdue.contracts_count, stats.overdue.value, { label: 'Contratos:', value: stats.overdue.contracts_count }, { label: 'Pagos:', value: stats.overdue.payments_count });
        currentRow += 4;
        this.addStatRowWithDetails(worksheet, currentRow, statsStartColumn, 'VENCIDOS CONTRATO', stats.overdue.contract.contracts_count, stats.overdue.contract.value, { label: 'Contratos:', value: stats.overdue.contract.contracts_count }, { label: 'Pagos:', value: stats.overdue.contract.payments_count });
        currentRow += 4;
        this.addStatRowWithDetails(worksheet, currentRow, statsStartColumn, 'VENCIDOS ENGANCHE', stats.overdue.down_payment.contracts_count, stats.overdue.down_payment.value, { label: 'Contratos:', value: stats.overdue.down_payment.contracts_count }, { label: 'Pagos:', value: stats.overdue.down_payment.payments_count });
        currentRow += 4;
        worksheet.getColumn(statsStartColumn).width = 18;
        worksheet.getColumn(statsStartColumn + 1).width = 18;
        const buffer = await workbook.xlsx.writeBuffer();
        return buffer;
    }
    formatDate(date) {
        if (!date)
            return '';
        const dateStr = typeof date === 'string' ? date : date.toString();
        const parts = dateStr.split('T')[0].split('-');
        if (parts.length === 3) {
            const year = parseInt(parts[0]);
            const month = parseInt(parts[1]);
            const day = parseInt(parts[2]);
            return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
        }
        const d = new Date(date);
        return d.toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' });
    }
    addStatRow(worksheet, row, column, label, count, value) {
        const labelCell = worksheet.getCell(row, column);
        labelCell.value = label;
        labelCell.font = { bold: true, size: 10, color: { argb: 'FF4B5A8A' } };
        labelCell.alignment = { horizontal: 'left', vertical: 'center' };
        const countCell = worksheet.getCell(row, column + 1);
        countCell.value = count;
        countCell.font = { bold: true, size: 11, color: { argb: 'FF000000' } };
        countCell.alignment = { horizontal: 'right', vertical: 'center' };
        countCell.numFmt = '#,##0';
        const valueCell = worksheet.getCell(row + 1, column);
        valueCell.value = 'Monto:';
        valueCell.font = { size: 9, color: { argb: 'FF666666' } };
        valueCell.alignment = { horizontal: 'left', vertical: 'center' };
        const valueAmountCell = worksheet.getCell(row + 1, column + 1);
        valueAmountCell.value = value;
        valueAmountCell.font = { bold: true, size: 10, color: { argb: 'FF000000' } };
        valueAmountCell.alignment = { horizontal: 'right', vertical: 'center' };
        valueAmountCell.numFmt = '$#,##0.00';
    }
    addStatRowWithDetails(worksheet, row, column, label, count, value, detail1, detail2) {
        const labelCell = worksheet.getCell(row, column);
        labelCell.value = label;
        labelCell.font = { bold: true, size: 10, color: { argb: 'FF4B5A8A' } };
        labelCell.alignment = { horizontal: 'left', vertical: 'center' };
        const countCell = worksheet.getCell(row, column + 1);
        countCell.value = count;
        countCell.font = { bold: true, size: 11, color: { argb: 'FF000000' } };
        countCell.alignment = { horizontal: 'right', vertical: 'center' };
        countCell.numFmt = '#,##0';
        const valueCell = worksheet.getCell(row + 1, column);
        valueCell.value = 'Monto:';
        valueCell.font = { size: 9, color: { argb: 'FF666666' } };
        valueCell.alignment = { horizontal: 'left', vertical: 'center' };
        const valueAmountCell = worksheet.getCell(row + 1, column + 1);
        valueAmountCell.value = value;
        valueAmountCell.font = { bold: true, size: 10, color: { argb: 'FF000000' } };
        valueAmountCell.alignment = { horizontal: 'right', vertical: 'center' };
        valueAmountCell.numFmt = '$#,##0.00';
        const detail1LabelCell = worksheet.getCell(row + 2, column);
        detail1LabelCell.value = detail1.label;
        detail1LabelCell.font = { size: 9, color: { argb: 'FF666666' } };
        detail1LabelCell.alignment = { horizontal: 'left', vertical: 'center' };
        const detail1ValueCell = worksheet.getCell(row + 2, column + 1);
        detail1ValueCell.value = detail1.value;
        detail1ValueCell.font = { bold: true, size: 9, color: { argb: 'FF000000' } };
        detail1ValueCell.alignment = { horizontal: 'right', vertical: 'center' };
        if (detail1.label.includes('Pagado') || detail1.label.includes('Contratos')) {
            detail1ValueCell.numFmt = '$#,##0.00';
        }
        else {
            detail1ValueCell.numFmt = '#,##0';
        }
        const detail2LabelCell = worksheet.getCell(row + 3, column);
        detail2LabelCell.value = detail2.label;
        detail2LabelCell.font = { size: 9, color: { argb: 'FF666666' } };
        detail2LabelCell.alignment = { horizontal: 'left', vertical: 'center' };
        const detail2ValueCell = worksheet.getCell(row + 3, column + 1);
        detail2ValueCell.value = detail2.value;
        detail2ValueCell.font = { bold: true, size: 9, color: { argb: 'FF000000' } };
        detail2ValueCell.alignment = { horizontal: 'right', vertical: 'center' };
        if (detail2.label.includes('Pendiente')) {
            detail2ValueCell.numFmt = '$#,##0.00';
        }
        else {
            detail2ValueCell.numFmt = '#,##0';
        }
    }
    async calculateFilteredStats(tenantId, filters = {}) {
        const baseQuery = () => {
            const query = this.contractRepo
                .createQueryBuilder('c')
                .where('c.tenant_id = :tenantId', { tenantId });
            (0, contract_list_filters_util_1.joinContractFilterRelations)(query);
            (0, contract_list_filters_util_1.applyContractListFilters)(query, filters);
            return query;
        };
        const totalQuery = baseQuery();
        if (!filters.status) {
            totalQuery.andWhere('c.status IN (:...totalStatuses)', {
                totalStatuses: ['activo', 'completado'],
            });
        }
        const totalStats = await totalQuery
            .select('COUNT(DISTINCT c.id)', 'count')
            .addSelect('SUM(c.total_price)', 'value')
            .getRawOne();
        const completedStats = await baseQuery()
            .andWhere('c.status = :completedStatus', { completedStatus: 'completado' })
            .select('COUNT(DISTINCT c.id)', 'count')
            .addSelect('SUM(c.total_price)', 'value')
            .getRawOne();
        const pendingStats = await baseQuery()
            .andWhere('c.status = :activeStatus', { activeStatus: 'activo' })
            .select('COUNT(DISTINCT c.id)', 'count')
            .addSelect('SUM(c.total_price)', 'value')
            .addSelect('SUM(c.total_price - c.remaining_balance)', 'paid')
            .addSelect('SUM(c.remaining_balance)', 'remaining')
            .getRawOne();
        const overdue = await (0, contract_list_insight_util_1.loadFilteredOverdueStats)(baseQuery);
        return {
            total: {
                count: parseInt(totalStats.count) || 0,
                value: parseFloat(totalStats.value) || 0,
            },
            completed: {
                count: parseInt(completedStats.count) || 0,
                value: parseFloat(completedStats.value) || 0,
            },
            pending: {
                count: parseInt(pendingStats.count) || 0,
                value: parseFloat(pendingStats.value) || 0,
                paid: parseFloat(pendingStats.paid) || 0,
                remaining: parseFloat(pendingStats.remaining) || 0,
            },
            overdue,
        };
    }
};
exports.ContractsExportService = ContractsExportService;
exports.ContractsExportService = ContractsExportService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(contract_entity_1.Contract)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ContractsExportService);
//# sourceMappingURL=contracts-export.service.js.map