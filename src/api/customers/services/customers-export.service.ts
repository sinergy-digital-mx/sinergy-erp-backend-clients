import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Customer } from '../../../entities/customers/customer.entity';
import { CustomerCredit } from '../../../entities/customers/customer-credit.entity';
import { QueryCustomersExportDto } from '../dto/query-customers-export.dto';
import {
  buildExportSubtitle,
  buildStyledExcelBuffer,
  ExcelColumnDef,
  formatExportDateTime,
} from '../../../common/utils/excel-export.util';
import {
  applyCustomerDirectoryFilters,
  customerInsightLabel,
  isCustomerListInsight,
} from '../utils/customer-list-insight.util';

@Injectable()
export class CustomersExportService {
  private readonly columns: ExcelColumnDef[] = [
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

  constructor(
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    @InjectRepository(CustomerCredit)
    private readonly creditRepo: Repository<CustomerCredit>,
  ) {}

  async exportCustomers(tenantId: string, filters: QueryCustomersExportDto): Promise<Buffer> {
    const customers = await this.fetchCustomers(tenantId, filters);
    const creditByCustomer = await this.loadCreditSummaries(
      tenantId,
      customers.map((c) => c.id),
    );

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
        created_at: formatExportDateTime(c.created_at),
      };
    });

    return buildStyledExcelBuffer({
      sheetName: 'Clientes',
      title: 'Reporte de clientes',
      subtitle: buildExportSubtitle([
        `Generado: ${formatExportDateTime(new Date())}`,
        `Registros: ${rows.length}`,
        this.describeFilters(filters),
      ]),
      columns: this.columns,
      rows,
      headerColor: 'FFC47B2B',
      titleColor: 'FFA05E1A',
    });
  }

  getFilename(): string {
    return `clientes-${new Date().toISOString().slice(0, 10)}.xlsx`;
  }

  private async loadCreditSummaries(
    tenantId: string,
    customerIds: number[],
  ): Promise<Map<number, { enabled: boolean; detail: string }>> {
    const result = new Map<number, { enabled: boolean; detail: string }>();
    if (customerIds.length === 0) {
      return result;
    }

    const rows = await this.creditRepo.find({
      where: { tenant_id: tenantId, customer_id: In(customerIds), credit_enabled: true },
      relations: ['fiscal_configuration'],
    });

    const grouped = new Map<number, string[]>();
    for (const row of rows) {
      const currency = row.credit_currency === 'USD' ? 'USD' : 'MXN';
      const label = `${row.fiscal_configuration?.razon_social ?? row.fiscal_configuration_id}: $${Number(row.credit_amount ?? 0).toFixed(2)} ${currency} (${row.credit_days ?? 0}d)`;
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

  private async fetchCustomers(
    tenantId: string,
    query?: QueryCustomersExportDto,
  ): Promise<Customer[]> {
    const qb = this.customerRepo
      .createQueryBuilder('customer')
      .leftJoinAndSelect('customer.status', 'status')
      .leftJoinAndSelect(
        'customer.group',
        'group',
        'group.tenant_id = customer.tenant_id',
      )
      .leftJoinAndSelect('customer.warehouse', 'warehouse')
      .leftJoin('customer.registered_fiscal_configuration', 'registeredFiscal')
      .addSelect(['registeredFiscal.id', 'registeredFiscal.razon_social', 'registeredFiscal.rfc'])
      .leftJoin('customer.contracts', 'contracts')
      .leftJoin('contracts.property', 'property')
      .where('customer.tenant_id = :tenantId', { tenantId });

    applyCustomerDirectoryFilters(qb, query);

    qb.orderBy('customer.created_at', 'DESC');

    return qb.getMany();
  }

  private formatPhone(code?: string | null, phone?: string | null): string {
    if (!phone) return '';
    if (code) return `+${code} ${phone}`;
    return phone;
  }

  private describeFilters(filters: QueryCustomersExportDto): string {
    const parts: string[] = [];
    if (filters.search) parts.push(`Búsqueda: ${filters.search}`);
    if (filters.status_id) parts.push(`Estatus ID: ${filters.status_id}`);
    if (filters.group_id) parts.push('Grupo filtrado');
    if (filters.registered_fiscal_configuration_id) parts.push('Razón social asignada');
    if (isCustomerListInsight(filters.insight)) {
      parts.push(customerInsightLabel(filters.insight));
    }
    return parts.join(' | ');
  }
}
