import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contract } from '../../entities/contracts/contract.entity';
import { QueryMonthlyIncomeDto } from './dto/query-monthly-income.dto';
import {
  buildMonthlyIncomeAnalysis,
  MonthlyIncomePaymentInput,
  MonthlyIncomeUnscheduledInput,
} from './utils/contract-monthly-income.util';

@Injectable()
export class ContractMonthlyIncomeService {
  constructor(
    @InjectRepository(Contract)
    private readonly contractRepo: Repository<Contract>,
  ) {}

  async getMonthlyIncome(tenantId: string, query: QueryMonthlyIncomeDto) {
    const [payments, unscheduled] = await Promise.all([
      this.loadPayments(tenantId, query),
      this.loadUnscheduled(tenantId, query),
    ]);

    return buildMonthlyIncomeAnalysis({
      year: query.year,
      month: query.month,
      payments,
      unscheduled,
    });
  }

  private monthRange(query: QueryMonthlyIncomeDto): { start: string; end: string } {
    const start = `${query.year}-${String(query.month).padStart(2, '0')}-01`;
    const lastDay = new Date(Date.UTC(query.year, query.month, 0)).getUTCDate();
    const end = `${query.year}-${String(query.month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return { start, end };
  }

  private async loadPayments(
    tenantId: string,
    query: QueryMonthlyIncomeDto,
  ): Promise<MonthlyIncomePaymentInput[]> {
    const { start, end } = this.monthRange(query);
    const params: Array<string | number> = [tenantId, start, end, start];
    let groupClause = '';
    if (query.group_id) {
      groupClause = 'AND (cu.group_id = ? OR pr.group_id = ?)';
      params.push(query.group_id, query.group_id);
    }

    return this.contractRepo.manager.query(
      `
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
      `,
      params,
    );
  }

  private async loadUnscheduled(
    tenantId: string,
    query: QueryMonthlyIncomeDto,
  ): Promise<MonthlyIncomeUnscheduledInput[]> {
    const { start, end } = this.monthRange(query);
    const params: Array<string | number> = [tenantId, start, end];
    let groupClause = '';
    if (query.group_id) {
      groupClause = 'AND (cu.group_id = ? OR pr.group_id = ?)';
      params.push(query.group_id, query.group_id);
    }

    return this.contractRepo.manager.query(
      `
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
      `,
      params,
    );
  }
}
