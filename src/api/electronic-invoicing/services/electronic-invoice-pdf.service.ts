import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import PdfPrinter from 'pdfmake';
import * as path from 'path';
import { Repository } from 'typeorm';
import { S3Service } from '../../../common/services/s3.service';
import { ElectronicInvoice } from '../../../entities/electronic-invoicing/electronic-invoice.entity';
import { FiscalConfiguration } from '../../../entities/billing/fiscal-configuration.entity';
import { BillingBranch } from '../../../entities/billing/billing-branch.entity';
import { Customer } from '../../../entities/customers/customer.entity';
import { SalesOrder } from '../../../entities/sales-orders/sales-order.entity';
import { ParsedCfdi, parseCfdiXmlForPdf, parseStampedCfdiXml } from '../utils/cfdi-xml.parser';
import { composeFiscalAddress } from '../../customers/utils/fiscal-domicile.util';
import { buildCfdiVerificationUrl, generateCfdiQrDataUrl } from '../utils/cfdi-qr.util';
import {
  labelFormaPago,
  labelMetodoPago,
  labelRegimenFiscal,
  labelTipoComprobante,
  labelUsoCfdi,
} from '../utils/cfdi-catalog-labels';

export interface ElectronicInvoicePdfUploadResult {
  s3Key: string;
  signedUrl: string;
  fileName: string;
  preview?: boolean;
}

@Injectable()
export class ElectronicInvoicePdfService {
  private readonly logger = new Logger(ElectronicInvoicePdfService.name);
  private readonly brandText = '#3d5a73';
  private readonly sectionBg = '#e8f1f6';
  private readonly panelBg = '#f3f7fa';
  private readonly borderColor = '#d4e0ea';
  private readonly fonts = {
    Roboto: {
      normal: path.join(process.cwd(), 'src/_public/fonts/Roboto-Regular.ttf'),
      bold: path.join(process.cwd(), 'src/_public/fonts/Roboto-Bold.ttf'),
      italics: path.join(process.cwd(), 'src/_public/fonts/Roboto-Italic.ttf'),
      bolditalics: path.join(process.cwd(), 'src/_public/fonts/Roboto-BoldItalic.ttf'),
    },
  };

  constructor(
    private readonly s3Service: S3Service,
    @InjectRepository(BillingBranch)
    private readonly billingBranchRepo: Repository<BillingBranch>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    @InjectRepository(SalesOrder)
    private readonly salesOrderRepo: Repository<SalesOrder>,
  ) {}

  async generateAndUpload(
    invoice: ElectronicInvoice,
    fiscal: FiscalConfiguration,
  ): Promise<ElectronicInvoicePdfUploadResult> {
    if (!invoice.xml_stamped) {
      throw new BadRequestException('La factura no tiene XML timbrado para generar PDF');
    }

    const cfdi = parseStampedCfdiXml(invoice.xml_stamped);
    const branch = await this.billingBranchRepo.findOne({
      where: { fiscal_configuration_id: fiscal.id, status: 1 },
      order: { created_at: 'ASC' },
    });
    const receptor = await this.findReceptorCustomer(invoice, cfdi.receptor.rfc);

    const pdfBuffer = await this.buildPdfBuffer(cfdi, fiscal, branch, receptor);
    return this.uploadPdf(invoice, cfdi, pdfBuffer);
  }

  async getSignedPdfUrl(invoice: ElectronicInvoice): Promise<ElectronicInvoicePdfUploadResult> {
    if (!invoice.pdf_stamped_s3_key) {
      throw new BadRequestException('La factura no tiene PDF generado');
    }

    const fileName = this.buildFileName(invoice);
    const signedUrl = await this.s3Service.getSignedUrl(invoice.pdf_stamped_s3_key, 3600);
    return {
      s3Key: invoice.pdf_stamped_s3_key,
      signedUrl,
      fileName,
    };
  }

  /** Vista previa desde xml_unsigned; no persiste en la factura. Solo ambiente demo. */
  async generatePreviewAndUpload(
    invoice: ElectronicInvoice,
    fiscal: FiscalConfiguration,
  ): Promise<ElectronicInvoicePdfUploadResult> {
    const xml = invoice.xml_unsigned?.trim();
    if (!xml) {
      throw new BadRequestException(
        'La factura no tiene XML para generar vista previa del PDF',
      );
    }

    const cfdi = parseCfdiXmlForPdf(xml);
    const branch = await this.billingBranchRepo.findOne({
      where: { fiscal_configuration_id: fiscal.id, status: 1 },
      order: { created_at: 'ASC' },
    });
    const receptor = await this.findReceptorCustomer(invoice, cfdi.receptor.rfc);

    const pdfBuffer = await this.buildPdfBuffer(cfdi, fiscal, branch, receptor, { preview: true });
    const upload = await this.uploadPdf(invoice, cfdi, pdfBuffer, { preview: true });
    return { ...upload, preview: true };
  }

  private async buildPdfBuffer(
    cfdi: ParsedCfdi,
    fiscal: FiscalConfiguration,
    branch: BillingBranch | null,
    receptor: Customer | null,
    options: { preview?: boolean } = {},
  ): Promise<Buffer> {
    const printer = new PdfPrinter(this.fonts);
    const logoImage = await this.getLogoImage(fiscal.logo);
    const isPreview = options.preview === true;
    const hasTimbre = Boolean(cfdi.timbre.uuid);
    const qrImage =
      !isPreview && hasTimbre
        ? await generateCfdiQrDataUrl(buildCfdiVerificationUrl(cfdi))
        : null;
    const emisorAddress = this.formatEmisorAddress(branch);
    const serieFolio = [cfdi.serie, cfdi.folio].filter(Boolean).join(' / ') || '—';

    const conceptRows: any[] = [
      [
        { text: 'Cant.', style: 'tableTh' },
        { text: 'Clave Unidad', style: 'tableTh' },
        { text: 'Unidad', style: 'tableTh' },
        { text: 'C. Prod/Serv', style: 'tableTh' },
        { text: 'Descripcion', style: 'tableTh' },
        { text: 'Valor Unitario', style: 'tableTh' },
        { text: 'Descuento', style: 'tableTh' },
        { text: 'Importe', style: 'tableTh' },
      ],
    ];

    for (const concepto of cfdi.conceptos) {
      conceptRows.push([
        concepto.cantidad,
        concepto.claveUnidad,
        concepto.unidad,
        concepto.claveProdServ,
        concepto.descripcion,
        this.formatCurrency(concepto.valorUnitario),
        this.formatCurrency(concepto.descuento || '0'),
        this.formatCurrency(concepto.importe),
      ]);

      for (const traslado of concepto.traslados) {
        conceptRows.push([
          {
            colSpan: 8,
            text: this.formatConceptTaxLine(traslado),
            style: 'conceptTax',
          },
          {},
          {},
          {},
          {},
          {},
          {},
          {},
        ]);
      }
    }

    const previewBanner = isPreview
      ? {
          text: 'VISTA PREVIA — Modo pruebas Finkok. Documento sin timbrar; no válido ante el SAT.',
          style: 'previewBanner',
          margin: [0, 0, 0, 10],
        }
      : null;

    const uuidLabel = hasTimbre ? cfdi.timbre.uuid : 'Pendiente de timbrado';
    const emisorNombre = cfdi.emisor.nombre || fiscal.razon_social;

    const docDefinition: any = {
      pageSize: 'LETTER',
      pageMargins: [24, 22, 24, 22],
      content: [
        ...(previewBanner ? [previewBanner] : []),
        {
          table: {
            widths: [70, '*', 176],
            body: [
              [
                {
                  ...(logoImage
                    ? { image: logoImage, fit: [66, 48], alignment: 'center', margin: [0, 4, 4, 0] }
                    : { text: '' }),
                  valign: 'top',
                },
                {
                  stack: [
                    { text: emisorNombre, style: 'issuerName' },
                    ...(emisorAddress ? [{ text: emisorAddress, style: 'issuerMeta' }] : []),
                    { text: `RFC: ${cfdi.emisor.rfc}`, style: 'issuerMeta' },
                    {
                      text: `Regimen fiscal: ${labelRegimenFiscal(cfdi.emisor.regimenFiscal)}`,
                      style: 'issuerMeta',
                    },
                    {
                      text: `Lugar de expedicion: ${cfdi.lugarExpedicion}`,
                      style: 'issuerMeta',
                    },
                    this.buildComprobanteHeader(cfdi),
                  ],
                  margin: [4, 2, 8, 0],
                  valign: 'top',
                },
                { ...this.buildFacturaBox(cfdi, serieFolio, uuidLabel, hasTimbre), valign: 'top' },
              ],
            ],
          },
          layout: 'noBorders',
          margin: [0, 0, 0, 6],
        },
        this.headerDivider(),
        this.sectionBar('DATOS DEL CLIENTE'),
        this.infoPairsTable([
          ['Nombre', { text: cfdi.receptor.nombre, bold: true }],
          ['RFC', cfdi.receptor.rfc],
          ['Domicilio fiscal', this.formatReceptorAddress(receptor, cfdi.receptor.domicilioFiscalReceptor)],
          ['Regimen fiscal', labelRegimenFiscal(cfdi.receptor.regimenFiscalReceptor)],
          ['Uso CFDI', labelUsoCfdi(cfdi.receptor.usoCfdi)],
          ['Version CFDI', `CFDI ${cfdi.version || '4.0'}`],
        ]),
        this.sectionBar('CONCEPTOS'),
        {
          table: {
            headerRows: 1,
            widths: [28, 52, 42, 58, '*', 58, 52, 58],
            body: conceptRows,
          },
          layout: this.tableLayout(),
          margin: [0, 0, 0, 8],
        },
        {
          columns: [
            { width: '*', text: '' },
            {
              width: 210,
              table: {
                widths: ['*', 78],
                body: this.buildTotalsRows(cfdi),
              },
              layout: this.totalsLayout(),
            },
          ],
          margin: [0, 0, 0, 12],
        },
        {
          table: {
            widths: [108, '*'],
            body: [
              [
                qrImage
                  ? { image: qrImage, width: 108, alignment: 'center' }
                  : {
                      table: {
                        widths: ['*'],
                        body: [
                          [
                            {
                              text: isPreview ? 'QR disponible\ntras timbrado' : 'Sin QR',
                              style: 'qrPlaceholder',
                              alignment: 'center',
                            },
                          ],
                        ],
                      },
                      layout: this.boxLayout(),
                    },
                {
                  stack: [
                    this.sealBlock(
                      'Cadena original del complemento de certificacion digital del SAT',
                      hasTimbre ? uuidLabel : '—',
                    ),
                    this.sealBlock('Sello digital del CFDI', cfdi.timbre.selloCFD),
                    this.sealBlock('Sello digital del SAT', cfdi.timbre.selloSAT),
                    {
                      columns: [
                        {
                          width: '*',
                          stack: [
                            this.footerMeta('No. certificado SAT', cfdi.timbre.noCertificadoSAT),
                            this.footerMeta('Fecha de certificacion', cfdi.timbre.fechaTimbrado),
                          ],
                        },
                        {
                          width: '*',
                          stack: [
                            this.footerMeta(
                              'RFC proveedor certificacion',
                              cfdi.timbre.rfcProvCertif,
                            ),
                            this.footerMeta('Folio fiscal (UUID)', uuidLabel),
                          ],
                        },
                      ],
                      margin: [0, 4, 0, 0],
                    },
                  ],
                  margin: [8, 0, 0, 0],
                },
              ],
            ],
          },
          layout: 'noBorders',
        },
        {
          text: isPreview
            ? 'Vista previa de representacion impresa — no es un CFDI vigente'
            : 'Este documento es una representacion impresa de un CFDI',
          style: 'legalLegend',
          margin: [0, 12, 0, 0],
        },
        {
          text: [
            { text: 'Generada por ', color: '#8b7cc9' },
            { text: 'Vexia', bold: true, color: '#6d4ec9' },
          ],
          style: 'vexiaCredit',
          margin: [0, 3, 0, 0],
        },
      ],
      styles: {
        issuerName: { fontSize: 11, bold: true, color: '#0f172a' },
        issuerMeta: { fontSize: 7.5, color: '#475569', margin: [0, 1, 0, 0] },
        facturaTitle: {
          fontSize: 9,
          bold: true,
          color: this.brandText,
          fillColor: this.sectionBg,
        },
        facturaLabel: { fontSize: 6.5, color: '#64748b' },
        facturaValue: { fontSize: 6.5, color: '#334155', bold: true },
        sectionBarText: {
          fontSize: 8,
          bold: true,
          color: this.brandText,
        },
        infoLabel: { fontSize: 7.5, color: '#64748b', fillColor: this.panelBg },
        infoValue: { fontSize: 7.5, color: '#334155' },
        compHeaderTitle: { fontSize: 7, bold: true, color: this.brandText },
        compLine: { fontSize: 6.5, lineHeight: 0.95, color: '#334155' },
        compLabel: { fontSize: 6.5, color: '#64748b' },
        compValue: { fontSize: 6.5, color: '#334155' },
        tableTh: { fontSize: 7, bold: true, color: '#475569', fillColor: '#edf2f6' },
        conceptTax: { fontSize: 7, color: '#64748b', italics: true, fillColor: this.panelBg },
        totalLabel: { fontSize: 8, color: '#64748b', margin: [6, 4, 4, 4] },
        totalValue: { fontSize: 8, color: '#334155', alignment: 'right', margin: [4, 4, 6, 4] },
        totalLabelStrong: {
          fontSize: 9,
          bold: true,
          color: this.brandText,
          fillColor: this.sectionBg,
          margin: [6, 5, 4, 5],
        },
        totalValueStrong: {
          fontSize: 9,
          bold: true,
          color: this.brandText,
          fillColor: this.sectionBg,
          alignment: 'right',
          margin: [4, 5, 6, 5],
        },
        sealTitle: {
          fontSize: 6.5,
          bold: true,
          color: '#4a6278',
          fillColor: this.panelBg,
          margin: [4, 3, 4, 3],
        },
        sealBody: {
          fontSize: 5.5,
          color: '#334155',
          margin: [4, 3, 4, 3],
          alignment: 'left',
        },
        footerMetaLabel: { fontSize: 6.5, color: '#64748b' },
        footerMetaValue: { fontSize: 6.5, color: '#0f172a', bold: true },
        legalLegend: { fontSize: 7, italics: true, alignment: 'center', color: '#94a3b8' },
        vexiaCredit: { fontSize: 6.5, alignment: 'center' },
        previewBanner: {
          fontSize: 8.5,
          bold: true,
          color: '#92400e',
          fillColor: '#fef3c7',
          alignment: 'center',
          margin: [0, 0, 0, 8],
        },
        qrPlaceholder: { fontSize: 7.5, color: '#94a3b8', margin: [4, 28, 4, 28] },
      },
      defaultStyle: {
        fontSize: 8,
        color: '#0f172a',
      },
    };

    return this.renderPdf(printer, docDefinition);
  }

  private async uploadPdf(
    invoice: ElectronicInvoice,
    cfdi: ParsedCfdi,
    pdfBuffer: Buffer,
    options: { preview?: boolean } = {},
  ): Promise<ElectronicInvoicePdfUploadResult> {
    const fileName = this.buildFileName(invoice, cfdi, options.preview);
    const { entityType, entityId, documentType } = this.resolveS3Path(invoice, options.preview);

    const s3Key = await this.s3Service.uploadEntityFile(
      invoice.tenant_id,
      entityType,
      entityId,
      documentType,
      pdfBuffer,
      fileName,
      'application/pdf',
    );

    const signedUrl = await this.s3Service.getSignedUrl(s3Key, 3600);
    return { s3Key, signedUrl, fileName };
  }

  /**
   * Ruta S3 alineada con documentos de OV:
   * {tenant}/sales_orders/{orderId}/cfdi_pdf/{uuid}.pdf
   * Fallback: {tenant}/electronic_invoices/{invoiceId}/cfdi_pdf/{uuid}.pdf
   */
  resolveS3Path(
    invoice: ElectronicInvoice,
    preview = false,
  ): {
    entityType: string;
    entityId: string;
    documentType: string;
  } {
    const documentType = preview ? 'cfdi_pdf_preview' : 'cfdi_pdf';

    if (invoice.source_module === 'sales_orders') {
      return {
        entityType: 'sales_orders',
        entityId: invoice.source_id,
        documentType,
      };
    }

    return {
      entityType: 'electronic_invoices',
      entityId: invoice.id,
      documentType,
    };
  }

  private buildFileName(
    invoice: ElectronicInvoice,
    cfdi?: ParsedCfdi,
    preview = false,
  ): string {
    const uuid = cfdi?.timbre.uuid ?? invoice.uuid ?? invoice.id;
    const serie = cfdi?.serie ?? invoice.series ?? '';
    const folio = cfdi?.folio ?? invoice.folio ?? '';
    const serieFolio = [serie, folio].filter(Boolean).join('-');
    const suffix = serieFolio ? `${serieFolio}-` : '';
    const prefix = preview ? 'PREVIEW-' : '';
    return `${prefix}CFDI-${suffix}${uuid}.pdf`;
  }

  private formatEmisorAddress(branch: BillingBranch | null): string {
    if (!branch) {
      return '';
    }

    return [
      branch.address,
      branch.city,
      branch.state,
      branch.postal_code ? `C.P. ${branch.postal_code}` : null,
      branch.country,
    ]
      .filter(Boolean)
      .join(', ');
  }

  private async findReceptorCustomer(
    invoice: ElectronicInvoice,
    receptorRfc: string,
  ): Promise<Customer | null> {
    const rfc = receptorRfc?.trim().toUpperCase();

    if (invoice.source_module === 'sales_orders' && invoice.source_id) {
      const order = await this.salesOrderRepo.findOne({
        where: { id: invoice.source_id, tenant_id: invoice.tenant_id },
        select: ['id', 'customer_id'],
      });
      if (order?.customer_id) {
        const byOrder = await this.customerRepo.findOne({
          where: { id: order.customer_id, tenant_id: invoice.tenant_id },
        });
        const orderRfc = byOrder?.fiscal_rfc?.trim().toUpperCase() ?? '';
        if (byOrder && rfc && orderRfc === rfc) {
          return byOrder;
        }
      }
    }

    if (!rfc) {
      return null;
    }

    return this.customerRepo
      .createQueryBuilder('customer')
      .where('customer.tenant_id = :tenantId', { tenantId: invoice.tenant_id })
      .andWhere('UPPER(customer.fiscal_rfc) = :rfc', { rfc })
      .getOne();
  }

  private formatReceptorAddress(customer: Customer | null, xmlPostalCode?: string): string {
    const postal = customer?.fiscal_postal_code?.trim() || xmlPostalCode?.trim();
    const streetLine =
      composeFiscalAddress({
        street: customer?.fiscal_street,
        exteriorNumber: customer?.fiscal_exterior_number,
        interiorNumber: customer?.fiscal_interior_number,
        colonia: customer?.fiscal_colonia,
      }) || customer?.fiscal_address?.trim();

    const country = this.formatCountry(customer?.fiscal_country);

    const formatted = [
      streetLine,
      customer?.fiscal_localidad?.trim(),
      customer?.fiscal_municipio?.trim() || customer?.fiscal_city?.trim(),
      customer?.fiscal_state?.trim(),
      postal ? `C.P. ${postal}` : null,
      country,
    ]
      .filter(Boolean)
      .join(', ');

    return formatted || postal || '—';
  }

  private formatCountry(code?: string | null): string | null {
    const value = code?.trim();
    if (!value) {
      return null;
    }
    if (value.toUpperCase() === 'MEX' || value.toLowerCase() === 'mexico' || value.toLowerCase() === 'méxico') {
      return 'México';
    }
    return value;
  }

  private formatCurrency(value: string | number): string {
    const amount = Number(value) || 0;
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  private formatTaxRate(tasaOCuota?: string): string {
    const rate = Number(tasaOCuota);
    if (!Number.isFinite(rate)) {
      return '0 %';
    }
    return `${(rate * 100).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })} %`;
  }

  private formatConceptTaxLine(traslado: {
    impuesto: string;
    tipoFactor: string;
    tasaOCuota: string;
    base: string;
    importe: string;
  }): string {
    const taxName =
      traslado.impuesto === '002' ? 'IVA' : traslado.impuesto === '003' ? 'IEPS' : 'Traslado';
    return `${taxName} ${this.formatTaxRate(traslado.tasaOCuota)}  ·  Base ${this.formatCurrency(traslado.base)}  ·  Importe ${this.formatCurrency(traslado.importe || '0')}`;
  }

  private totalRow(label: string, value: string | number) {
    return [
      { text: label, style: 'totalLabel' },
      { text: this.formatCurrency(value || 0), style: 'totalValue' },
    ];
  }

  private buildTotalsRows(cfdi: ParsedCfdi) {
    return [
      this.totalRow('SubTotal', cfdi.subTotal),
      this.totalRow('Descuento', cfdi.descuento || '0'),
      this.totalRow('IVA', cfdi.totalImpuestosTrasladados || '0'),
      [
        { text: 'Total', style: 'totalLabelStrong' },
        { text: this.formatCurrency(cfdi.total), style: 'totalValueStrong' },
      ],
    ];
  }

  /**
   * pdfmake solo parte texto en espacios. Los sellos CFDI son una sola cadena,
   * así que se insertan espacios cada N caracteres para que quepan en el recuadro.
   */
  private wrapUnbreakable(value: string | null | undefined, groupSize = 64): string {
    const text = value?.trim();
    if (!text) {
      return '—';
    }
    return text.replace(new RegExp(`.{1,${groupSize}}`, 'g'), '$& ').trimEnd();
  }

  private buildComprobanteHeader(cfdi: ParsedCfdi) {
    const pairs: Array<[string, string]> = [
      ['Forma de pago', labelFormaPago(cfdi.formaPago)],
      ['Método de pago', labelMetodoPago(cfdi.metodoPago)],
      ['Tipo', labelTipoComprobante(cfdi.tipoComprobante)],
      ['Moneda', cfdi.moneda || 'MXN'],
      ['Exportación', cfdi.exportacion || '01'],
    ];

    return {
      stack: [
        { text: 'Datos del comprobante', style: 'compHeaderTitle', margin: [0, 6, 0, 1] },
        ...pairs.map(([label, value]) => ({
          text: [
            { text: `${label}:  `, style: 'compLabel' },
            { text: value, style: 'compValue' },
          ],
          style: 'compLine',
          margin: [0, 0, 0, 0],
        })),
      ],
      margin: [0, 0, 0, 0],
    };
  }

  private headerDivider() {
    return {
      canvas: [
        {
          type: 'line',
          x1: 0,
          y1: 0,
          x2: 564,
          y2: 0,
          lineWidth: 0.8,
          lineColor: this.borderColor,
        },
      ],
      margin: [0, 0, 0, 4],
    };
  }

  private sectionBar(title: string) {
    return {
      text: title,
      style: 'sectionBarText',
      margin: [0, 6, 0, 2],
    };
  }

  private buildFacturaBox(
    cfdi: ParsedCfdi,
    serieFolio: string,
    uuidLabel: string,
    hasTimbre: boolean,
  ) {
    const rows = [
      this.facturaRow('Folio fiscal', serieFolio),
      this.facturaRow('Fecha emision', cfdi.fecha || '—'),
      this.facturaRow('Fecha certificacion', cfdi.timbre.fechaTimbrado || '—'),
      this.facturaRow('Folio fiscal (UUID)', uuidLabel),
      this.facturaRow('No. certificado CSD', cfdi.noCertificado || '—'),
      this.facturaRow(
        'No. certificado SAT',
        hasTimbre ? cfdi.timbre.noCertificadoSAT || '—' : '—',
      ),
    ];

    return {
      table: {
        widths: ['*'],
        body: [
          [{ text: 'FACTURA', style: 'facturaTitle', alignment: 'center', margin: [0, 6, 0, 6] }],
          [{ stack: rows, margin: [6, 6, 6, 6] }],
        ],
      },
      layout: this.facturaBoxLayout(),
    };
  }

  private facturaRow(label: string, value: string) {
    return {
      stack: [
        { text: label, style: 'facturaLabel' },
        { text: this.wrapUnbreakable(value, 24), style: 'facturaValue' },
      ],
      margin: [0, 0, 0, 4],
    };
  }

  private infoPairsTable(
    pairs: Array<[string, string | { text: string; bold?: boolean }]>,
    options: { margin?: number[] } = {},
  ) {
    return {
      table: {
        widths: ['34%', '66%'],
        body: pairs.map(([label, value]) => [
          { text: label, style: 'infoLabel', margin: [6, 4, 4, 4] },
          typeof value === 'string'
            ? { text: value, style: 'infoValue', margin: [4, 4, 6, 4] }
            : {
                text: value.text,
                style: 'infoValue',
                bold: value.bold === true,
                margin: [4, 4, 6, 4],
              },
        ]),
      },
      layout: this.boxLayout(),
      margin: options.margin ?? [0, 0, 0, 10],
    };
  }

  private sealBlock(title: string, body: string) {
    return {
      table: {
        widths: ['*'],
        dontBreakRows: false,
        body: [
          [{ text: title, style: 'sealTitle' }],
          [{ text: this.wrapUnbreakable(body), style: 'sealBody' }],
        ],
      },
      layout: this.boxLayout(),
      margin: [0, 0, 0, 4],
    };
  }

  private footerMeta(label: string, value?: string | null) {
    return {
      stack: [
        { text: label, style: 'footerMetaLabel' },
        { text: value || '—', style: 'footerMetaValue' },
      ],
      margin: [0, 0, 0, 4],
    };
  }

  private facturaBoxLayout() {
    return {
      hLineColor: () => this.borderColor,
      vLineColor: () => this.borderColor,
      hLineWidth: (i: number, node: { table: { body: unknown[] } }) =>
        i === 0 || i === node.table.body.length ? 0.8 : 0,
      vLineWidth: () => 0.8,
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 0,
    };
  }

  private boxLayout() {
    return {
      hLineColor: () => this.borderColor,
      vLineColor: () => this.borderColor,
      hLineWidth: () => 0.6,
      vLineWidth: () => 0.6,
      paddingTop: () => 0,
      paddingBottom: () => 0,
      paddingLeft: () => 0,
      paddingRight: () => 0,
    };
  }

  private totalsLayout() {
    return {
      hLineColor: () => this.borderColor,
      vLineColor: () => this.borderColor,
      hLineWidth: (i: number, node: { table: { body: unknown[] } }) =>
        i === 0 || i === node.table.body.length ? 1 : 0.5,
      vLineWidth: () => 1,
      paddingTop: () => 0,
      paddingBottom: () => 0,
      paddingLeft: () => 0,
      paddingRight: () => 0,
    };
  }

  private tableLayout() {
    return {
      hLineColor: () => this.borderColor,
      vLineColor: () => this.borderColor,
      hLineWidth: () => 0.4,
      vLineWidth: () => 0.4,
      paddingTop: () => 4,
      paddingBottom: () => 4,
      paddingLeft: () => 4,
      paddingRight: () => 4,
    };
  }

  private async getLogoImage(logoKey: string | null | undefined): Promise<string | null> {
    if (!logoKey) {
      return null;
    }

    try {
      const signedUrl = await this.s3Service.getSignedUrl(logoKey, 900);
      const response = await fetch(signedUrl);
      if (!response.ok) {
        return null;
      }

      const contentType = response.headers.get('content-type') || 'image/png';
      const buffer = Buffer.from(await response.arrayBuffer());
      return `data:${contentType};base64,${buffer.toString('base64')}`;
    } catch (error) {
      this.logger.warn(`No se pudo cargar logo fiscal: ${error instanceof Error ? error.message : error}`);
      return null;
    }
  }

  private renderPdf(printer: PdfPrinter, docDefinition: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const pdfDoc = printer.createPdfKitDocument(docDefinition);
        const chunks: Buffer[] = [];

        pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
        pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
        pdfDoc.on('error', reject);
        pdfDoc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}
