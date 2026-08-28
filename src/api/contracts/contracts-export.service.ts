import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { Contract } from '../../entities/contracts/contract.entity';
import {
  applyContractListFilters,
  ContractListFilters,
  joinContractFilterRelations,
} from './contract-list-filters.util';

@Injectable()
export class ContractsExportService {
  constructor(
    @InjectRepository(Contract)
    private contractRepo: Repository<Contract>,
  ) {}

  async exportToExcel(
    tenantId: string,
    filters: ContractListFilters = {},
  ): Promise<Buffer> {
    const query = this.contractRepo
      .createQueryBuilder('c')
      .where('c.tenant_id = :tenantId', { tenantId });
    joinContractFilterRelations(query, { select: true });
    applyContractListFilters(query, filters);

    const contracts = await query
      .orderBy('CASE WHEN c.status = :activeStatus AND c.id NOT IN (SELECT DISTINCT contract_id FROM contract_payments WHERE is_overdue = true) THEN 0 WHEN c.status = :activeStatus THEN 1 WHEN c.status = :completedStatus THEN 2 ELSE 3 END', 'ASC')
      .addOrderBy('(SELECT COUNT(*) FROM contract_payments WHERE contract_id = c.id AND payment_date < CURDATE() AND status IN (:...statuses))', 'DESC')
      .addOrderBy('c.contract_date', 'DESC')
      .setParameter('activeStatus', 'activo')
      .setParameter('completedStatus', 'completado')
      .setParameter('statuses', ['pendiente', 'parcial'])
      .getMany();

    const stats = await this.calculateFilteredStats(tenantId, filters);

    // Get payment stats for each contract
    const contractIds = contracts.map(c => c.id);
    
    // Get paid payments count and total paid amount
    const paidPaymentsQuery = `
      SELECT 
        contract_id,
        COUNT(*) as paid_count,
        SUM(amount) as total_paid
      FROM contract_payments
      WHERE contract_id IN (${contractIds.map(() => '?').join(',')})
        AND tenant_id = ?
        AND status = 'pagado'
      GROUP BY contract_id
    `;

    const paidPayments = await this.contractRepo.manager.query(
      paidPaymentsQuery,
      [...contractIds, tenantId]
    );

    const paidPaymentMap = new Map();
    paidPayments.forEach(row => {
      paidPaymentMap.set(row.contract_id, {
        paid_count: row.paid_count || 0,
        total_paid: Number(row.total_paid) || 0,
      });
    });

    // Get next payment info
    const nextPaymentsQuery = `
      SELECT p.*
      FROM contract_payments p
      INNER JOIN (
        SELECT contract_id, MIN(due_date) as next_due_date
        FROM contract_payments
        WHERE contract_id IN (${contractIds.map(() => '?').join(',')})
          AND tenant_id = ?
          AND status IN ('pendiente', 'parcial', 'vencido')
        GROUP BY contract_id
      ) next_p ON p.contract_id = next_p.contract_id AND p.due_date = next_p.next_due_date
      WHERE p.tenant_id = ?
        AND p.status IN ('pendiente', 'parcial', 'vencido')
      ORDER BY p.is_overdue DESC, p.due_date ASC
    `;

    const nextPayments = await this.contractRepo.manager.query(
      nextPaymentsQuery,
      [...contractIds, tenantId, tenantId]
    );

    const nextPaymentMap = new Map();
    nextPayments.forEach(payment => {
      nextPaymentMap.set(payment.contract_id, {
        next_payment_date: payment.due_date,
        next_payment_status: payment.status,
        next_payment_number: payment.payment_number,
        next_payment_amount: payment.status === 'parcial' 
          ? Number(payment.amount_pending) 
          : Number(payment.amount),
      });
    });

    // Get overdue payment counts
    const overdueCountsQuery = `
      SELECT contract_id, COUNT(*) as overdue_count
      FROM contract_payments
      WHERE contract_id IN (${contractIds.map(() => '?').join(',')})
        AND tenant_id = ?
        AND payment_date < CURDATE()
        AND status IN ('pendiente', 'parcial')
      GROUP BY contract_id
    `;

    const overdueCounts = await this.contractRepo.manager.query(
      overdueCountsQuery,
      [...contractIds, tenantId]
    );

    const overdueCountMap = new Map();
    overdueCounts.forEach(row => {
      overdueCountMap.set(row.contract_id, row.overdue_count);
    });

    // Prepare data for Excel
    const excelData = contracts.map(contract => {
      const totalPrice = Number(contract.total_price) || 0;
      const downPayment = Number(contract.down_payment) || 0;
      const financedAmount = totalPrice - downPayment;
      const paidInfo = paidPaymentMap.get(contract.id) || { paid_count: 0, total_paid: 0 };
      const nextPayment = nextPaymentMap.get(contract.id) || {};

      return {
        'Número Contrato': contract.contract_number,
        'Cliente': `${contract.customer?.name || ''} ${contract.customer?.lastname || ''}`.trim(),
        'Lote': contract.property?.code || '',
        'Fecha Inicio': this.formatDate(contract.contract_date),
        'Precio Total': totalPrice,
        'Enganche': downPayment,
        'Monto Financiado': financedAmount,
        'Saldo Pendiente': Number(contract.remaining_balance) || 0,
        'Meses Pagados': paidInfo.paid_count,
        'Monto Pagado': paidInfo.total_paid,
        'Próximo Pago': nextPayment.next_payment_date ? this.formatDate(nextPayment.next_payment_date) : 'N/A',
        'Monto Próximo Pago': nextPayment.next_payment_amount ? nextPayment.next_payment_amount : 'N/A',
        'Estado': contract.status,
        'Pagos Vencidos': overdueCountMap.get(contract.id) || 0,
      };
    });

    // Create workbook with ExcelJS
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Contratos');

    // Add header row
    const headerRow = worksheet.addRow(Object.keys(excelData[0] || {}));

    // Style header
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4B5A8A' }, // Dark blue
      };
      cell.font = {
        bold: true,
        color: { argb: 'FFFFFFFF' }, // White
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

    // Add data rows with alternating colors
    excelData.forEach((data, index) => {
      const row = worksheet.addRow(Object.values(data));
      const isEvenRow = index % 2 === 0;

      row.eachCell((cell, colNumber) => {
        // Alternating row colors
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: isEvenRow ? 'FFFFFFFF' : 'FFF5F5F5' }, // White or light gray
        };

        // Borders
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          right: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        };

        // Alignment
        if (colNumber <= 4 || colNumber === 13) {
          // Text columns (left align)
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        } else {
          // Number columns (right align)
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
        }

        // Format numbers as currency
        if (colNumber >= 5 && colNumber <= 12 && colNumber !== 9 && colNumber !== 13) {
          if (typeof cell.value === 'number') {
            cell.numFmt = '$#,##0.00';
          }
        }
      });
    });

    // Set column widths
    worksheet.columns = [
      { width: 15 }, // Número Contrato
      { width: 25 }, // Cliente
      { width: 12 }, // Lote
      { width: 15 }, // Fecha Inicio
      { width: 14 }, // Precio Total
      { width: 14 }, // Enganche
      { width: 16 }, // Monto Financiado
      { width: 16 }, // Saldo Pendiente
      { width: 14 }, // Meses Pagados
      { width: 14 }, // Monto Pagado
      { width: 15 }, // Próximo Pago
      { width: 18 }, // Monto Próximo Pago
      { width: 12 }, // Estado
      { width: 14 }, // Pagos Vencidos
    ];

    // Freeze header row
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    // Add summary stats to the right of the table
    const statsStartColumn = 17; // Column Q (after the 14 data columns + some space)
    const statsStartRow = 2;

    // Add stats title
    const titleCell = worksheet.getCell(statsStartRow, statsStartColumn);
    titleCell.value = 'RESUMEN';
    titleCell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4B5A8A' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.mergeCells(statsStartRow, statsStartColumn, statsStartRow, statsStartColumn + 1);

    let currentRow = statsStartRow + 2;

    // Total
    this.addStatRow(worksheet, currentRow, statsStartColumn, 'TOTAL', stats.total.count, stats.total.value);
    currentRow += 2;

    // Completados
    this.addStatRow(worksheet, currentRow, statsStartColumn, 'COMPLETADOS', stats.completed.count, stats.completed.value);
    currentRow += 2;

    // Activos (with paid/pending details)
    this.addStatRowWithDetails(worksheet, currentRow, statsStartColumn, 'ACTIVOS', stats.pending.count, stats.pending.value, 
      { label: 'Pagado:', value: stats.pending.paid },
      { label: 'Pendiente:', value: stats.pending.remaining }
    );
    currentRow += 4;

    // Vencidos (with contracts/payments details)
    this.addStatRowWithDetails(worksheet, currentRow, statsStartColumn, 'VENCIDOS', stats.overdue.contracts_count, stats.overdue.value,
      { label: 'Contratos:', value: stats.overdue.contracts_count },
      { label: 'Pagos:', value: stats.overdue.payments_count }
    );
    currentRow += 4;

    // Set column widths for stats
    worksheet.getColumn(statsStartColumn).width = 18;
    worksheet.getColumn(statsStartColumn + 1).width = 18;

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as any;
  }

  private formatDate(date: any): string {
    if (!date) return '';
    
    // Convertir a string si es necesario
    const dateStr = typeof date === 'string' ? date : date.toString();
    
    // Parsear fecha sin aplicar timezone (usar UTC)
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      const day = parseInt(parts[2]);
      
      // Formato DD/MM/YYYY
      return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
    }
    
    // Fallback
    const d = new Date(date);
    return d.toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' });
  }

  private addStatRow(worksheet: any, row: number, column: number, label: string, count: number, value: number): void {
    // Label cell
    const labelCell = worksheet.getCell(row, column);
    labelCell.value = label;
    labelCell.font = { bold: true, size: 10, color: { argb: 'FF4B5A8A' } };
    labelCell.alignment = { horizontal: 'left', vertical: 'center' };

    // Count cell
    const countCell = worksheet.getCell(row, column + 1);
    countCell.value = count;
    countCell.font = { bold: true, size: 11, color: { argb: 'FF000000' } };
    countCell.alignment = { horizontal: 'right', vertical: 'center' };
    countCell.numFmt = '#,##0';

    // Value row
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

  private addStatRowWithDetails(
    worksheet: any,
    row: number,
    column: number,
    label: string,
    count: number,
    value: number,
    detail1: { label: string; value: number },
    detail2: { label: string; value: number }
  ): void {
    // Label cell
    const labelCell = worksheet.getCell(row, column);
    labelCell.value = label;
    labelCell.font = { bold: true, size: 10, color: { argb: 'FF4B5A8A' } };
    labelCell.alignment = { horizontal: 'left', vertical: 'center' };

    // Count cell
    const countCell = worksheet.getCell(row, column + 1);
    countCell.value = count;
    countCell.font = { bold: true, size: 11, color: { argb: 'FF000000' } };
    countCell.alignment = { horizontal: 'right', vertical: 'center' };
    countCell.numFmt = '#,##0';

    // Value row
    const valueCell = worksheet.getCell(row + 1, column);
    valueCell.value = 'Monto:';
    valueCell.font = { size: 9, color: { argb: 'FF666666' } };
    valueCell.alignment = { horizontal: 'left', vertical: 'center' };

    const valueAmountCell = worksheet.getCell(row + 1, column + 1);
    valueAmountCell.value = value;
    valueAmountCell.font = { bold: true, size: 10, color: { argb: 'FF000000' } };
    valueAmountCell.alignment = { horizontal: 'right', vertical: 'center' };
    valueAmountCell.numFmt = '$#,##0.00';

    // Detail 1 row
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
    } else {
      detail1ValueCell.numFmt = '#,##0';
    }

    // Detail 2 row
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
    } else {
      detail2ValueCell.numFmt = '#,##0';
    }
  }

  private async calculateFilteredStats(
    tenantId: string,
    filters: ContractListFilters = {},
  ): Promise<any> {
    const baseQuery = () => {
      const query = this.contractRepo
        .createQueryBuilder('c')
        .where('c.tenant_id = :tenantId', { tenantId });
      joinContractFilterRelations(query);
      applyContractListFilters(query, filters);
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

    const overdueResult = await baseQuery()
      .leftJoin(
        'contract_payments',
        'p',
        'p.contract_id = c.id AND p.payment_date < CURDATE() AND p.status IN (:...overduePaymentStatuses)',
        { overduePaymentStatuses: ['pendiente', 'parcial'] },
      )
      .andWhere('c.status = :overdueContractStatus', { overdueContractStatus: 'activo' })
      .andWhere('p.id IS NOT NULL')
      .select('COUNT(DISTINCT c.id)', 'contracts_count')
      .addSelect('COUNT(p.id)', 'payments_count')
      .addSelect(
        'SUM(CASE WHEN p.status = "parcial" THEN p.amount_pending ELSE p.amount END)',
        'value',
      )
      .getRawOne();

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
      overdue: {
        contracts_count: parseInt(overdueResult.contracts_count) || 0,
        payments_count: parseInt(overdueResult.payments_count) || 0,
        value: parseFloat(overdueResult.value) || 0,
      },
    };
  }
}
