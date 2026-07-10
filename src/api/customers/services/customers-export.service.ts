import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../../../entities/customers/customer.entity';
import { QueryCustomersExportDto } from '../dto/query-customers-export.dto';
import {
  buildExportSubtitle,
  buildStyledExcelBuffer,
  ExcelColumnDef,
  formatExportDate,
  formatExportDateTime,
  num,
} from '../../../common/utils/excel-export.util';

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
    { header: 'RFC', key: 'fiscal_rfc', width: 16 },
    { header: 'Razón social', key: 'fiscal_razon_social', width: 26 },
    { header: 'Almacén', key: 'warehouse_name', width: 20 },
    { header: 'Días crédito', key: 'credit_days', width: 12, type: 'integer' },
    { header: 'Monto crédito', key: 'credit_amount', width: 14, type: 'currency' },
    { header: 'Fecha creación', key: 'created_at', width: 18, type: 'date' },
  ];

  constructor(
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
  ) {}

  async exportCustomers(tenantId: string, filters: QueryCustomersExportDto): Promise<Buffer> {
    const customers = await this.fetchCustomers(tenantId, filters);

    const rows = customers.map((c) => ({
      id: c.id,
      name: c.name ?? '',
      lastname: c.lastname ?? '',
      company_name: c.company_name ?? '',
      email: c.email ?? '',
      phone: this.formatPhone(c.phone_code, c.phone),
      status_name: c.status?.name ?? '',
      group_name: c.group?.name ?? '',
      fiscal_rfc: c.fiscal_rfc ?? '',
      fiscal_razon_social: c.fiscal_razon_social ?? '',
      warehouse_name: c.warehouse?.name ?? '',
      credit_days: c.credit_days ?? '',
      credit_amount: c.credit_amount != null ? num(c.credit_amount) : '',
      created_at: formatExportDateTime(c.created_at),
    }));

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

  private async fetchCustomers(
    tenantId: string,
    query?: QueryCustomersExportDto,
  ): Promise<Customer[]> {
    const qb = this.customerRepo
      .createQueryBuilder('customer')
      .leftJoinAndSelect('customer.status', 'status')
      .leftJoinAndSelect('customer.group', 'group')
      .leftJoinAndSelect('customer.warehouse', 'warehouse')
      .leftJoin('customer.contracts', 'contracts')
      .leftJoin('contracts.property', 'property')
      .where('customer.tenant_id = :tenantId', { tenantId });

    if (query?.search) {
      const term = `%${query.search.trim()}%`;
      qb.andWhere(
        `(
          LOWER(customer.name) LIKE LOWER(:search)
          OR LOWER(customer.lastname) LIKE LOWER(:search)
          OR LOWER(CONCAT(customer.name, ' ', COALESCE(customer.lastname, ''))) LIKE LOWER(:search)
          OR LOWER(CONCAT(COALESCE(customer.lastname, ''), ' ', customer.name)) LIKE LOWER(:search)
          OR LOWER(customer.email) LIKE LOWER(:search)
          OR LOWER(customer.phone) LIKE LOWER(:search)
          OR LOWER(customer.phone_code) LIKE LOWER(:search)
          OR LOWER(CONCAT(COALESCE(customer.phone_code, ''), customer.phone)) LIKE LOWER(:search)
          OR LOWER(customer.company_name) LIKE LOWER(:search)
          OR LOWER(customer.website) LIKE LOWER(:search)
          OR LOWER(customer.additional_name) LIKE LOWER(:search)
          OR LOWER(customer.additional_lastname) LIKE LOWER(:search)
          OR LOWER(CONCAT(customer.additional_name, ' ', COALESCE(customer.additional_lastname, ''))) LIKE LOWER(:search)
          OR LOWER(customer.additional_email) LIKE LOWER(:search)
          OR LOWER(customer.additional_phone) LIKE LOWER(:search)
          OR LOWER(customer.fiscal_rfc) LIKE LOWER(:search)
          OR LOWER(customer.fiscal_razon_social) LIKE LOWER(:search)
          OR LOWER(property.code) LIKE LOWER(:search)
          OR LOWER(property.name) LIKE LOWER(:search)
          OR LOWER(contracts.contract_number) LIKE LOWER(:search)
        )`,
        { search: term },
      );
    }

    if (query?.status_id) {
      qb.andWhere('customer.status_id = :status_id', { status_id: query.status_id });
    }

    if (query?.group_id) {
      qb.andWhere('customer.group_id = :group_id', { group_id: query.group_id });
    }

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
    return parts.join(' | ');
  }
}
