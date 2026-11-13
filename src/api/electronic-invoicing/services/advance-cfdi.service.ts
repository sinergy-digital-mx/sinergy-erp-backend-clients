import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ElectronicInvoice } from '../../../entities/electronic-invoicing/electronic-invoice.entity';
import { ElectronicInvoiceService } from './electronic-invoice.service';
import {
  ADVANCE_APPLICATION_DESCRIPTION,
  ADVANCE_DESCRIPTION,
  AdvanceInvoiceRole,
  AdvanceParty,
  BuiltCfdiAmounts,
  MerchandiseLineInput,
  buildAdvanceConceptCfdi,
  buildMerchandiseCfdi,
  inferIvaPercentage,
  taxableBaseOfDocument,
} from '../utils/advance-cfdi.util';
import { StampAdvanceInvoiceDto } from '../dto/stamp-advance-invoice.dto';

export interface AdvanceDocumentContext {
  sourceModule: 'quotations' | 'sales_orders';
  sourceId: string;
  folio: string;
  subtotal: number;
  discountTotal: number;
  globalDiscount: number;
  ivaTotal: number;
  fiscalConfigurationId: string;
  series?: string | null;
  emisor: AdvanceParty;
  receptor: AdvanceParty;
  lines?: MerchandiseLineInput[];
}

export interface AdvanceInvoiceSummary {
  id: string;
  uuid: string | null;
  series: string | null;
  folio: string | null;
  subtotal: number;
  total: number;
  stamp_status: string;
  sat_status: string | null;
  invoice_role: AdvanceInvoiceRole;
  applied: boolean;
  merchandise_invoice_id: string | null;
  application_invoice_id: string | null;
}

@Injectable()
export class AdvanceCfdiService {
  constructor(
    @InjectRepository(ElectronicInvoice)
    private readonly invoiceRepo: Repository<ElectronicInvoice>,
    private readonly electronicInvoiceService: ElectronicInvoiceService,
  ) {}

  async findVigenteAdvance(
    tenantId: string,
    sourceModule: 'quotations' | 'sales_orders',
    sourceId: string,
  ): Promise<ElectronicInvoice | null> {
    const invoices = await this.electronicInvoiceService.findBySource(tenantId, sourceModule, sourceId);
    return (
      invoices.find(
        (invoice) =>
          invoice.invoice_role === 'advance' &&
          this.electronicInvoiceService.isCfdiVigente(invoice),
      ) ?? null
    );
  }

  async summarize(tenantId: string, invoice: ElectronicInvoice | null): Promise<AdvanceInvoiceSummary | null> {
    if (!invoice) return null;
    const related = await this.invoiceRepo.find({
      where: { tenant_id: tenantId, related_advance_invoice_id: invoice.id },
    });
    const merchandise =
      related.find(
        (row) =>
          row.invoice_role === 'merchandise' &&
          this.electronicInvoiceService.isCfdiVigente(row),
      ) ?? null;
    const application =
      related.find(
        (row) =>
          row.invoice_role === 'advance_application' &&
          this.electronicInvoiceService.isCfdiVigente(row),
      ) ?? null;
    return {
      id: invoice.id,
      uuid: invoice.uuid,
      series: invoice.series,
      folio: invoice.folio,
      subtotal: Number(invoice.subtotal),
      total: Number(invoice.total),
      stamp_status: invoice.stamp_status,
      sat_status: invoice.sat_status,
      invoice_role: advanceInvoiceRole(invoice.invoice_role),
      applied: !!merchandise && !!application,
      merchandise_invoice_id: merchandise?.id ?? null,
      application_invoice_id: application?.id ?? null,
    };
  }

  async stampAdvance(
    tenantId: string,
    userId: string,
    document: AdvanceDocumentContext,
    dto: StampAdvanceInvoiceDto,
  ): Promise<ElectronicInvoice> {
    const existing = await this.findVigenteAdvance(tenantId, document.sourceModule, document.sourceId);
    if (existing) {
      throw new BadRequestException(
        'Ya hay una factura de anticipo vigente. Cancélala antes de timbrar otra.',
      );
    }

    const defaultBase = taxableBaseOfDocument(
      document.subtotal,
      document.discountTotal,
      document.globalDiscount,
    );
    const base = dto.base_amount ?? defaultBase;
    const iva =
      dto.iva_percentage ??
      inferIvaPercentage(document.ivaTotal, defaultBase);

    const built = buildAdvanceConceptCfdi({
      series: dto.series ?? document.series,
      folio: dto.folio ?? document.folio,
      baseAmount: base,
      ivaPercentage: iva,
      usoCfdi: dto.uso_cfdi ?? 'G01',
      formaPago: dto.forma_pago ?? '03',
      metodoPago: dto.metodo_pago ?? 'PUE',
      emisor: document.emisor,
      receptor: { ...document.receptor, regimen: dto.regimen_fiscal_receptor },
      tipoComprobante: 'I',
      descripcion: ADVANCE_DESCRIPTION,
    });

    return this.electronicInvoiceService.stamp(tenantId, userId, {
      fiscal_configuration_id: document.fiscalConfigurationId,
      source_module: document.sourceModule,
      source_id: document.sourceId,
      xml: built.xml,
      rfc_receptor: document.receptor.rfc,
      receptor_nombre: document.receptor.nombre,
      subtotal: built.subtotal,
      total: built.total,
      series: dto.series ?? document.series ?? undefined,
      folio: dto.folio ?? document.folio,
      tipo_comprobante: 'I',
      environment: dto.environment,
      invoice_role: 'advance',
      metadata: { invoice_role: 'advance', document_folio: document.folio },
    });
  }

  async applyToSalesOrder(
    tenantId: string,
    userId: string,
    document: AdvanceDocumentContext & { lines: MerchandiseLineInput[] },
    advance: ElectronicInvoice,
    dto: {
      uso_cfdi?: string;
      uso_cfdi_aplicacion?: string;
      forma_pago?: string;
      metodo_pago?: 'PUE' | 'PPD';
      regimen_fiscal_receptor: string;
      series?: string;
      environment?: 'demo' | 'production';
    },
  ): Promise<{ merchandise: ElectronicInvoice; application: ElectronicInvoice }> {
    if (!advance.uuid) {
      throw new BadRequestException('El anticipo no tiene UUID');
    }
    const summary = await this.summarize(tenantId, advance);
    if (summary?.applied) {
      throw new BadRequestException('Ese anticipo ya fue aplicado');
    }

    const related = await this.invoiceRepo.find({
      where: { tenant_id: tenantId, related_advance_invoice_id: advance.id },
    });
    let merchandise =
      related.find(
        (row) =>
          row.invoice_role === 'merchandise' &&
          this.electronicInvoiceService.isCfdiVigente(row),
      ) ?? null;
    let application =
      related.find(
        (row) =>
          row.invoice_role === 'advance_application' &&
          this.electronicInvoiceService.isCfdiVigente(row),
      ) ?? null;

    const receptor: AdvanceParty = {
      ...document.receptor,
      regimen: dto.regimen_fiscal_receptor,
    };
    const formaPago = dto.forma_pago ?? '03';
    const metodoPago = dto.metodo_pago ?? 'PUE';

    if (!merchandise) {
      let built: BuiltCfdiAmounts;
      try {
        built = buildMerchandiseCfdi({
          series: dto.series ?? document.series,
          folio: document.folio,
          lines: document.lines,
          globalDiscount: document.globalDiscount,
          advanceBase: Number(advance.subtotal),
          usoCfdi: dto.uso_cfdi ?? 'G01',
          formaPago,
          metodoPago,
          emisor: document.emisor,
          receptor,
          relatedUuid: advance.uuid,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'No se pudo armar la factura';
        throw new BadRequestException(message);
      }

      merchandise = await this.electronicInvoiceService.stamp(tenantId, userId, {
        fiscal_configuration_id: document.fiscalConfigurationId,
        source_module: 'sales_orders',
        source_id: document.sourceId,
        xml: built.xml,
        rfc_receptor: document.receptor.rfc,
        receptor_nombre: document.receptor.nombre,
        subtotal: built.subtotal,
        total: built.total,
        series: dto.series ?? document.series ?? undefined,
        folio: document.folio,
        tipo_comprobante: 'I',
        environment: dto.environment,
        invoice_role: 'merchandise',
        related_advance_invoice_id: advance.id,
        metadata: { invoice_role: 'merchandise', advance_uuid: advance.uuid },
      });
    }

    if (!application) {
      const built = buildAdvanceConceptCfdi({
        series: dto.series ?? document.series,
        folio: `${document.folio}-ANT`,
        baseAmount: Number(advance.subtotal),
        ivaPercentage: this.rateFromInvoice(advance),
        usoCfdi: dto.uso_cfdi_aplicacion ?? 'G02',
        formaPago,
        metodoPago,
        emisor: document.emisor,
        receptor,
        tipoComprobante: 'E',
        descripcion: ADVANCE_APPLICATION_DESCRIPTION,
        relatedUuid: advance.uuid,
      });
      try {
        application = await this.electronicInvoiceService.stamp(tenantId, userId, {
          fiscal_configuration_id: document.fiscalConfigurationId,
          source_module: 'sales_orders',
          source_id: document.sourceId,
          xml: built.xml,
          rfc_receptor: document.receptor.rfc,
          receptor_nombre: document.receptor.nombre,
          subtotal: built.subtotal,
          total: built.total,
          series: dto.series ?? document.series ?? undefined,
          folio: `${document.folio}-ANT`,
          tipo_comprobante: 'E',
          environment: dto.environment,
          invoice_role: 'advance_application',
          related_advance_invoice_id: advance.id,
          metadata: { invoice_role: 'advance_application', advance_uuid: advance.uuid },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error al timbrar la nota de crédito';
        throw new BadRequestException(
          `La factura de mercancía ya se timbró. Falta la nota de crédito del anticipo: ${message}`,
        );
      }
    }

    return { merchandise, application: application! };
  }

  async assertAdvanceCancellable(tenantId: string, invoice: ElectronicInvoice): Promise<void> {
    if (invoice.invoice_role !== 'advance') {
      return;
    }
    const summary = await this.summarize(tenantId, invoice);
    if (summary?.merchandise_invoice_id || summary?.application_invoice_id) {
      throw new BadRequestException(
        'Este anticipo ya tiene factura de mercancía o nota de crédito. Cancela esas primero.',
      );
    }
  }

  private rateFromInvoice(invoice: ElectronicInvoice): number {
    const subtotal = Number(invoice.subtotal) || 0;
    const total = Number(invoice.total) || 0;
    if (subtotal <= 0) return 0;
    const rate = ((total - subtotal) / subtotal) * 100;
    if (Math.abs(rate - 8) < 0.25) return 8;
    if (Math.abs(rate - 16) < 0.25) return 16;
    if (rate < 0.25) return 0;
    return Math.round(rate * 100) / 100;
  }
}

function advanceInvoiceRole(role: string): AdvanceInvoiceRole {
  if (role === 'merchandise' || role === 'advance_application' || role === 'standard') {
    return role;
  }
  return 'advance';
}
