import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesOrder } from '../../entities/sales-orders/sales-order.entity';
import { Customer } from '../../entities/customers/customer.entity';
import { CustomerStatus } from '../../entities/customers/customer-status.entity';
import { BillingBranch } from '../../entities/billing/billing-branch.entity';
import { ElectronicInvoiceService } from '../electronic-invoicing/services/electronic-invoice.service';
import { GENERIC_INVOICE_RFCS } from '../customers/utils/fiscal-invoice-readiness.util';
import { composeFiscalAddress } from '../customers/utils/fiscal-domicile.util';
import { IdentifySelfInvoiceDto } from './dto/identify-self-invoice.dto';
import { StampSelfInvoiceDto } from './dto/stamp-self-invoice.dto';
import { SELF_INVOICE_CATALOGS } from './self-invoice.constants';
import { normalizePublicInvoiceCode } from '../../common/utils/public-invoice-code.util';
import {
  composePhoneDigits,
  emailsMatch,
  isUsableEmail,
  normalizeEmail,
  phonesMatch,
} from './utils/self-invoice-contact.util';
import {
  buildSelfInvoiceCfdiXml,
  formatCfdiFecha,
} from './utils/self-invoice-cfdi-xml.util';

@Injectable()
export class SelfInvoiceService {
  private readonly logger = new Logger(SelfInvoiceService.name);

  constructor(
    @InjectRepository(SalesOrder)
    private readonly salesOrderRepo: Repository<SalesOrder>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    @InjectRepository(CustomerStatus)
    private readonly customerStatusRepo: Repository<CustomerStatus>,
    private readonly electronicInvoiceService: ElectronicInvoiceService,
    private readonly configService: ConfigService,
  ) {}

  async getReceipt(rawCode: string) {
    const order = await this.getOrderByPublicCode(rawCode);
    const invoice = await this.findCurrentInvoice(order);
    let pdf: { signedUrl: string; fileName: string } | null = null;
    if (invoice) {
      try {
        pdf = await this.electronicInvoiceService.getPdfDownload(invoice.id, order.tenant_id);
      } catch (error) {
        this.logger.warn(
          `No se pudo firmar PDF del recibo ${order.public_invoice_code}: ${error}`,
        );
      }
    }

    return {
      code: order.public_invoice_code,
      issuer_name: order.fiscal_razon_social || order.fiscal_configuration?.razon_social || null,
      branch_name: this.resolveBranch(order)?.code ?? null,
      sold_at: order.updated_at,
      total: Number(order.total),
      currency: 'MXN',
      already_invoiced: Boolean(invoice),
      invoice: invoice
        ? {
            id: invoice.id,
            uuid: invoice.uuid,
            stamped_at: invoice.stamped_at,
            pdf_url: pdf?.signedUrl ?? null,
            pdf_file_name: pdf?.fileName ?? null,
          }
        : null,
      catalogs: SELF_INVOICE_CATALOGS,
    };
  }

  async identify(rawCode: string, dto: IdentifySelfInvoiceDto) {
    const order = await this.getOrderByPublicCode(rawCode);
    this.assertInvoiceable(order);

    const customer = await this.findMatchingCustomer(order, dto.email, dto.phone);
    const invoice = await this.findCurrentInvoice(order);

    return {
      matched: Boolean(customer),
      code: order.public_invoice_code,
      total: Number(order.total),
      currency: 'MXN',
      issuer_name: order.fiscal_razon_social || order.fiscal_configuration?.razon_social || null,
      already_invoiced: Boolean(invoice),
      fiscal: customer ? this.toFiscalPayload(customer) : null,
      suggested: {
        uso_cfdi: 'G03',
        regimen_fiscal_receptor: this.suggestRegimen(customer),
        forma_pago: '01',
        metodo_pago: order.payment_status === 'Pagado' ? 'PUE' : 'PPD',
      },
    };
  }

  async stamp(rawCode: string, dto: StampSelfInvoiceDto) {
    const order = await this.getOrderByPublicCode(rawCode);
    this.assertInvoiceable(order);

    const existing = await this.findCurrentInvoice(order);
    if (existing) {
      throw new BadRequestException('Este recibo ya tiene una factura vigente');
    }

    const rfc = dto.fiscal_rfc.trim().toUpperCase();
    if (GENERIC_INVOICE_RFCS.has(rfc)) {
      throw new BadRequestException('Ingresa un RFC fiscal real, no público en general');
    }

    const fiscal = order.fiscal_configuration;
    if (!fiscal) {
      throw new BadRequestException('Esta sucursal aún no puede emitir facturas en línea');
    }
    if (fiscal.finkok_registration_status !== 'registered') {
      throw new BadRequestException('Esta sucursal aún no puede emitir facturas en línea');
    }
    if (!fiscal.fiscal_regime) {
      throw new BadRequestException('Esta sucursal aún no puede emitir facturas en línea');
    }

    const branch = this.resolveBranch(order);
    const lugarExpedicion = String(branch?.postal_code ?? '').replace(/\D/g, '');
    if (!/^\d{5}$/.test(lugarExpedicion)) {
      throw new BadRequestException('Esta sucursal aún no puede emitir facturas en línea');
    }

    const razonSocial = dto.fiscal_razon_social.trim().toUpperCase();
    const receptor = await this.persistReceptor(order, dto, rfc, razonSocial);

    const xml = buildSelfInvoiceCfdiXml({
      serie: fiscal.prefix ?? undefined,
      folio: this.folioFromPublicCode(order.public_invoice_code, order.folio),
      fecha: formatCfdiFecha(new Date()),
      formaPago: dto.forma_pago,
      metodoPago: dto.metodo_pago ?? (order.payment_status === 'Pagado' ? 'PUE' : 'PPD'),
      lugarExpedicion,
      globalDiscountAmount: Number(order.global_discount_amount) || 0,
      emisor: {
        rfc: fiscal.rfc,
        nombre: fiscal.razon_social,
        regimenFiscal: fiscal.fiscal_regime,
      },
      receptor: {
        rfc,
        nombre: razonSocial,
        domicilioFiscal: dto.fiscal_postal_code,
        regimenFiscal: dto.regimen_fiscal_receptor,
        usoCfdi: dto.uso_cfdi.toUpperCase(),
      },
      lines: (order.line_items ?? []).map((line) => ({
        description: line.product?.name ?? 'PRODUCTO',
        quantity: Number(line.quantity) || 0,
        unitPrice: Number(line.unit_price) || 0,
        discountUnit: Number(line.discount_unit) || 0,
        ivaPercentage: Number(line.iva_percentage) || 0,
        iepsPercentage: Number(line.ieps_percentage) || 0,
        satClave: line.product?.sat_clave,
        uomName: line.product_uom?.uom?.name,
      })),
    });

    const stamped = await this.electronicInvoiceService.stamp(
      order.tenant_id,
      order.collected_by_user_id ?? order.created_by,
      {
        fiscal_configuration_id: order.fiscal_configuration_id,
        source_module: 'sales_orders',
        source_id: order.id,
        xml,
        rfc_receptor: rfc,
        receptor_nombre: razonSocial,
        subtotal: Number(order.subtotal),
        total: Number(order.total),
        series: fiscal.prefix ?? undefined,
        folio: this.folioFromPublicCode(order.public_invoice_code, order.folio),
        environment: this.stampEnvironment(),
        metadata: {
          source: 'self_invoice_portal',
          public_invoice_code: order.public_invoice_code,
          customer_id: receptor.id,
          email: normalizeEmail(dto.email),
        },
      },
    );

    const pdf = await this.electronicInvoiceService.getPdfDownload(
      stamped.id,
      order.tenant_id,
    );

    return {
      code: order.public_invoice_code,
      uuid: stamped.uuid,
      stamp_status: stamped.stamp_status,
      total: Number(order.total),
      pdf_url: pdf.signedUrl,
      pdf_file_name: pdf.fileName,
      invoice_id: stamped.id,
    };
  }

  async getInvoiceXml(rawCode: string) {
    const order = await this.getOrderByPublicCode(rawCode);
    const invoice = await this.findCurrentInvoice(order);
    if (!invoice) {
      throw new NotFoundException('Este recibo aún no tiene factura');
    }
    return this.electronicInvoiceService.getXmlDownload(invoice.id, order.tenant_id);
  }

  async getInvoicePdf(rawCode: string) {
    const order = await this.getOrderByPublicCode(rawCode);
    const invoice = await this.findCurrentInvoice(order);
    if (!invoice) {
      throw new NotFoundException('Este recibo aún no tiene factura');
    }
    return this.electronicInvoiceService.getPdfDownload(invoice.id, order.tenant_id);
  }

  private async getOrderByPublicCode(rawCode: string): Promise<SalesOrder> {
    const code = normalizePublicInvoiceCode(rawCode);
    if (!code) {
      throw new NotFoundException('Recibo no encontrado');
    }

    const order = await this.salesOrderRepo
      .createQueryBuilder('so')
      .where('UPPER(so.public_invoice_code) = :code', { code })
      .leftJoinAndSelect('so.fiscal_configuration', 'fiscal_configuration')
      .leftJoinAndSelect('so.warehouse', 'warehouse')
      .leftJoinAndSelect('warehouse.billing_branch', 'billing_branch')
      .leftJoinAndSelect('so.customer', 'customer')
      .leftJoinAndSelect('so.line_items', 'line_items')
      .leftJoinAndSelect('line_items.product', 'product')
      .leftJoinAndSelect('line_items.product_uom', 'product_uom')
      .leftJoinAndSelect('product_uom.uom', 'uom')
      .getOne();

    if (!order) {
      throw new NotFoundException('Recibo no encontrado');
    }
    return order;
  }

  private assertInvoiceable(order: SalesOrder): void {
    if (order.general_status === 'Cancelada') {
      throw new BadRequestException('Este recibo no se puede facturar');
    }
  }

  private async findCurrentInvoice(order: SalesOrder) {
    const vigentes = await this.electronicInvoiceService.findVigenteBySource(
      order.tenant_id,
      'sales_orders',
      order.id,
    );
    return vigentes[0] ?? null;
  }

  private resolveBranch(order: SalesOrder): BillingBranch | null {
    return order.warehouse?.billing_branch ?? null;
  }

  private async findMatchingCustomer(
    order: SalesOrder,
    email: string,
    phone: string,
  ): Promise<Customer | null> {
    if (!isUsableEmail(email)) {
      return null;
    }

    const onOrder = order.customer;
    if (onOrder && this.contactsMatch(onOrder, email, phone) && this.hasRealRfc(onOrder)) {
      return onOrder;
    }

    const candidates = await this.customerRepo
      .createQueryBuilder('customer')
      .where('customer.tenant_id = :tenantId', { tenantId: order.tenant_id })
      .andWhere('LOWER(customer.email) = :email', { email: normalizeEmail(email) })
      .getMany();

    return (
      candidates.find(
        (customer) => this.contactsMatch(customer, email, phone) && this.hasRealRfc(customer),
      ) ?? null
    );
  }

  private contactsMatch(customer: Customer, email: string, phone: string): boolean {
    const storedPhone = composePhoneDigits(customer.phone, customer.phone_code);
    return emailsMatch(customer.email, email) && phonesMatch(storedPhone || customer.phone, phone);
  }

  private hasRealRfc(customer: Customer): boolean {
    const rfc = customer.fiscal_rfc?.trim().toUpperCase() ?? '';
    return Boolean(rfc) && !GENERIC_INVOICE_RFCS.has(rfc);
  }

  private toFiscalPayload(customer: Customer) {
    return {
      fiscal_rfc: customer.fiscal_rfc,
      fiscal_person_type: customer.fiscal_person_type,
      fiscal_razon_social: customer.fiscal_razon_social,
      fiscal_postal_code: customer.fiscal_postal_code,
      fiscal_country: customer.fiscal_country ?? 'MEX',
      fiscal_street: customer.fiscal_street,
      fiscal_exterior_number: customer.fiscal_exterior_number,
      fiscal_interior_number: customer.fiscal_interior_number,
      fiscal_colonia: customer.fiscal_colonia,
      fiscal_localidad: customer.fiscal_localidad,
      fiscal_municipio: customer.fiscal_municipio,
      fiscal_state: customer.fiscal_state,
    };
  }

  private suggestRegimen(customer: Customer | null): string {
    if (customer?.fiscal_person_type === 'fisica') {
      return '612';
    }
    return '601';
  }

  private async persistReceptor(
    order: SalesOrder,
    dto: StampSelfInvoiceDto,
    rfc: string,
    razonSocial: string,
  ): Promise<Customer> {
    const matched = await this.findMatchingCustomer(order, dto.email, dto.phone);
    let target =
      matched && this.hasRealRfc(matched)
        ? matched
        : await this.customerRepo
            .createQueryBuilder('customer')
            .where('customer.tenant_id = :tenantId', { tenantId: order.tenant_id })
            .andWhere('UPPER(customer.fiscal_rfc) = :rfc', { rfc })
            .getOne();

    const personType =
      dto.fiscal_person_type ?? (rfc.length === 12 ? 'moral' : 'fisica');
    const country = (dto.fiscal_country ?? 'MEX').toUpperCase();
    const fiscalAddress = composeFiscalAddress({
      street: dto.fiscal_street,
      exteriorNumber: dto.fiscal_exterior_number,
      interiorNumber: dto.fiscal_interior_number,
      colonia: dto.fiscal_colonia,
    });

    const patch = {
      email: normalizeEmail(dto.email),
      phone: dto.phone.replace(/\D/g, '').slice(-10),
      fiscal_rfc: rfc,
      fiscal_razon_social: razonSocial,
      fiscal_person_type: personType,
      fiscal_postal_code: dto.fiscal_postal_code,
      fiscal_country: country,
      fiscal_street: dto.fiscal_street?.trim() || undefined,
      fiscal_exterior_number: dto.fiscal_exterior_number?.trim() || undefined,
      fiscal_interior_number: dto.fiscal_interior_number?.trim() || undefined,
      fiscal_colonia: dto.fiscal_colonia?.trim() || undefined,
      fiscal_localidad: dto.fiscal_localidad?.trim() || undefined,
      fiscal_municipio: dto.fiscal_municipio?.trim() || undefined,
      fiscal_state: dto.fiscal_state?.trim() || undefined,
      fiscal_city: dto.fiscal_municipio?.trim() || undefined,
      fiscal_address: fiscalAddress ?? undefined,
    };

    if (target && !this.isGenericCustomer(target)) {
      Object.assign(target, patch);
      return this.customerRepo.save(target);
    }

    const status = await this.customerStatusRepo.findOne({ where: { code: 'ACTIVE' } });
    const created = this.customerRepo.create({
      tenant_id: order.tenant_id,
      name: razonSocial,
      company_name: personType === 'moral' ? razonSocial : undefined,
      status_id: status?.id ?? null,
      ...patch,
    });
    return this.customerRepo.save(created);
  }

  private isGenericCustomer(customer: Customer): boolean {
    const rfc = customer.fiscal_rfc?.trim().toUpperCase() ?? '';
    return !rfc || GENERIC_INVOICE_RFCS.has(rfc);
  }

  private folioFromPublicCode(publicCode: string | null, fallbackFolio: string): string {
    const match = String(publicCode ?? '').match(/(\d+)\s*$/);
    if (match) {
      return String(Number(match[1]));
    }
    const fromOrder = String(fallbackFolio).match(/(\d+)\s*$/);
    return fromOrder ? String(Number(fromOrder[1])) : fallbackFolio;
  }

  private stampEnvironment(): 'demo' | 'production' {
    const configured = this.configService.get<string>('SELF_INVOICE_FINKOK_ENVIRONMENT');
    if (configured === 'demo' || configured === 'production') {
      return configured;
    }
    return this.configService.get<string>('NODE_ENV') === 'production' ? 'production' : 'demo';
  }
}
