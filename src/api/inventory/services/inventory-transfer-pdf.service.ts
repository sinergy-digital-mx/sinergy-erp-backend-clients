import { Injectable } from '@nestjs/common';
import PdfPrinter from 'pdfmake';
import * as path from 'path';
import { InventoryTransferService } from './inventory-transfer.service';
import { InventoryTransferResponseDto } from '../dto/inventory-transfer-response.dto';

const COLORS = {
  primary: '#1E3A5F',
  accent: '#2F6FED',
  text: '#1F2937',
  muted: '#6B7280',
  light: '#F3F4F6',
  line: '#E5E7EB',
  success: '#059669',
  white: '#FFFFFF',
};

@Injectable()
export class InventoryTransferPdfService {
  private readonly fonts = {
    Roboto: {
      normal: path.join(process.cwd(), 'src/_public/fonts/Roboto-Regular.ttf'),
      bold: path.join(process.cwd(), 'src/_public/fonts/Roboto-Bold.ttf'),
      italics: path.join(process.cwd(), 'src/_public/fonts/Roboto-Italic.ttf'),
      bolditalics: path.join(
        process.cwd(),
        'src/_public/fonts/Roboto-BoldItalic.ttf',
      ),
    },
  };

  constructor(private readonly transferService: InventoryTransferService) {}

  async generatePdf(id: string, tenantId: string): Promise<{
    buffer: Buffer;
    filename: string;
  }> {
    const transfer = await this.transferService.findById(id, tenantId);
    const buffer = await this.render(transfer);
    const safeFolio = transfer.folio.replace(/[^a-zA-Z0-9-_]/g, '_');
    return {
      buffer,
      filename: `transferencia-${safeFolio}.pdf`,
    };
  }

  private async render(transfer: InventoryTransferResponseDto): Promise<Buffer> {
    const docDefinition: any = {
      pageSize: 'LETTER',
      pageMargins: [40, 40, 40, 48],
      defaultStyle: { font: 'Roboto', fontSize: 9, color: COLORS.text },
      content: [
        this.buildHeader(transfer),
        this.buildTitleBar(transfer),
        this.buildMetaCards(transfer),
        this.buildRouteSection(transfer),
        this.buildProductSection(transfer),
        this.buildLinesSection(transfer),
        this.buildNotes(transfer),
        this.buildFooterNote(transfer),
      ],
      footer: (currentPage: number, pageCount: number) => ({
        columns: [
          {
            text: 'Documento de transferencia de inventario',
            fontSize: 7,
            color: COLORS.muted,
          },
          {
            text: `Página ${currentPage} de ${pageCount}`,
            fontSize: 7,
            color: COLORS.muted,
            alignment: 'right',
          },
        ],
        margin: [40, 12, 40, 0],
      }),
    };

    const printer = new PdfPrinter(this.fonts);
    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', reject);
      pdfDoc.end();
    });
  }

  private buildHeader(transfer: InventoryTransferResponseDto): any {
    return {
      columns: [
        {
          width: '*',
          stack: [
            {
              text: 'SINERGY ERP',
              fontSize: 11,
              bold: true,
              color: COLORS.primary,
            },
            {
              text: 'Inventario · Transferencias',
              fontSize: 8,
              color: COLORS.muted,
              margin: [0, 2, 0, 0],
            },
          ],
        },
        {
          width: 'auto',
          stack: [
            {
              text: this.formatDateTime(transfer.created_at),
              fontSize: 8,
              color: COLORS.muted,
              alignment: 'right',
            },
            {
              text: this.statusLabel(transfer.status),
              fontSize: 8,
              bold: true,
              color: COLORS.success,
              alignment: 'right',
              margin: [0, 2, 0, 0],
            },
          ],
        },
      ],
      margin: [0, 0, 0, 12],
    };
  }

  private buildTitleBar(transfer: InventoryTransferResponseDto): any {
    return {
      table: {
        widths: ['*'],
        body: [
          [
            {
              columns: [
                {
                  text: 'COMPROBANTE DE TRANSFERENCIA',
                  fontSize: 13,
                  bold: true,
                  color: COLORS.white,
                },
                {
                  text: transfer.folio,
                  fontSize: 12,
                  bold: true,
                  color: COLORS.white,
                  alignment: 'right',
                  margin: [0, 1, 0, 0],
                },
              ],
              fillColor: COLORS.primary,
              margin: [12, 10, 12, 10],
              border: [false, false, false, false],
            },
          ],
        ],
      },
      layout: { hLineWidth: () => 0, vLineWidth: () => 0 },
      margin: [0, 0, 0, 14],
    };
  }

  private buildMetaCards(transfer: InventoryTransferResponseDto): any {
    const userName =
      transfer.created_by_user?.name?.trim() ||
      transfer.created_by_user?.email ||
      '—';

    return {
      table: {
        widths: ['33.33%', '33.33%', '33.34%'],
        body: [
          [
            this.metaCell('REALIZADO POR', userName),
            this.metaCell('CORREO', transfer.created_by_user?.email || '—'),
            this.metaCell(
              'CANTIDAD TOTAL',
              `${this.formatQty(transfer.total_quantity)} ${transfer.uom_name || ''}`.trim(),
            ),
          ],
        ],
      },
      layout: {
        hLineWidth: () => 0,
        vLineWidth: () => 0,
        paddingLeft: () => 10,
        paddingRight: () => 10,
        paddingTop: () => 8,
        paddingBottom: () => 8,
      },
      margin: [0, 0, 0, 14],
    };
  }

  private buildRouteSection(transfer: InventoryTransferResponseDto): any {
    const source = transfer.source_warehouse;
    const dest = transfer.destination_warehouse;

    return {
      stack: [
        {
          text: 'RUTA',
          fontSize: 8,
          bold: true,
          color: COLORS.muted,
          margin: [0, 0, 0, 6],
        },
        {
          table: {
            widths: ['44%', '12%', '44%'],
            body: [
              [
                {
                  stack: [
                    {
                      text: 'ORIGEN',
                      fontSize: 7,
                      bold: true,
                      color: COLORS.accent,
                    },
                    {
                      text: source?.name || '—',
                      fontSize: 11,
                      bold: true,
                      margin: [0, 4, 0, 0],
                    },
                    {
                      text: this.warehouseDetails(source),
                      fontSize: 7,
                      color: COLORS.muted,
                      margin: [0, 3, 0, 0],
                    },
                  ],
                  border: [false, false, false, false],
                  fillColor: COLORS.light,
                },
                {
                  text: '→',
                  fontSize: 22,
                  bold: true,
                  color: COLORS.accent,
                  alignment: 'center',
                  border: [false, false, false, false],
                  margin: [0, 14, 0, 0],
                },
                {
                  stack: [
                    {
                      text: 'DESTINO',
                      fontSize: 7,
                      bold: true,
                      color: COLORS.accent,
                    },
                    {
                      text: dest?.name || '—',
                      fontSize: 11,
                      bold: true,
                      margin: [0, 4, 0, 0],
                    },
                    {
                      text: this.warehouseDetails(dest),
                      fontSize: 7,
                      color: COLORS.muted,
                      margin: [0, 3, 0, 0],
                    },
                  ],
                  border: [false, false, false, false],
                  fillColor: COLORS.light,
                },
              ],
            ],
          },
          layout: {
            hLineWidth: () => 0,
            vLineWidth: () => 0,
            paddingLeft: () => 10,
            paddingRight: () => 10,
            paddingTop: () => 10,
            paddingBottom: () => 10,
          },
        },
      ],
      margin: [0, 0, 0, 14],
    };
  }

  private buildProductSection(transfer: InventoryTransferResponseDto): any {
    return {
      stack: [
        {
          text: 'PRODUCTO',
          fontSize: 8,
          bold: true,
          color: COLORS.muted,
          margin: [0, 0, 0, 6],
        },
        {
          table: {
            widths: ['55%', '25%', '20%'],
            body: [
              [
                {
                  stack: [
                    {
                      text: transfer.product_name || '—',
                      fontSize: 11,
                      bold: true,
                    },
                    {
                      text: `SKU: ${transfer.product_sku || '—'}`,
                      fontSize: 8,
                      color: COLORS.muted,
                      margin: [0, 3, 0, 0],
                    },
                  ],
                  border: [false, false, false, false],
                  fillColor: COLORS.light,
                },
                {
                  stack: [
                    { text: 'UOM', fontSize: 7, color: COLORS.muted },
                    {
                      text: transfer.uom_name || '—',
                      fontSize: 10,
                      bold: true,
                      margin: [0, 3, 0, 0],
                    },
                  ],
                  border: [false, false, false, false],
                  fillColor: COLORS.light,
                },
                {
                  stack: [
                    { text: 'LÍNEAS', fontSize: 7, color: COLORS.muted },
                    {
                      text: String(transfer.lines?.length ?? 0),
                      fontSize: 10,
                      bold: true,
                      margin: [0, 3, 0, 0],
                    },
                  ],
                  border: [false, false, false, false],
                  fillColor: COLORS.light,
                },
              ],
            ],
          },
          layout: {
            hLineWidth: () => 0,
            vLineWidth: () => 0,
            paddingLeft: () => 10,
            paddingRight: () => 10,
            paddingTop: () => 10,
            paddingBottom: () => 10,
          },
        },
      ],
      margin: [0, 0, 0, 14],
    };
  }

  private buildLinesSection(transfer: InventoryTransferResponseDto): any {
    const header = [
      { text: '#', style: 'th', alignment: 'center' },
      { text: 'LOTE ORIGEN', style: 'th' },
      { text: 'CANTIDAD', style: 'th', alignment: 'right' },
      { text: 'LOTE DESTINO', style: 'th' },
    ].map((cell) => ({
      ...cell,
      fillColor: COLORS.primary,
      color: COLORS.white,
      bold: true,
      fontSize: 8,
      margin: [4, 5, 4, 5],
    }));

    const rows = (transfer.lines ?? []).map((line, index) => [
      {
        text: String(index + 1),
        alignment: 'center',
        fontSize: 8,
        margin: [4, 5, 4, 5],
      },
      {
        text: line.source_batch_number || '—',
        fontSize: 8,
        margin: [4, 5, 4, 5],
      },
      {
        text: `${this.formatQty(line.quantity)} ${transfer.uom_name || ''}`.trim(),
        alignment: 'right',
        fontSize: 8,
        bold: true,
        margin: [4, 5, 4, 5],
      },
      {
        text: line.destination_batch_number || '—',
        fontSize: 8,
        margin: [4, 5, 4, 5],
      },
    ]);

    if (rows.length === 0) {
      rows.push([
        {
          text: 'Sin líneas registradas',
          colSpan: 4,
          alignment: 'center',
          color: COLORS.muted,
          margin: [4, 8, 4, 8],
        } as any,
        {},
        {},
        {},
      ]);
    }

    return {
      stack: [
        {
          text: 'DETALLE DE LÍNEAS',
          fontSize: 8,
          bold: true,
          color: COLORS.muted,
          margin: [0, 0, 0, 6],
        },
        {
          table: {
            headerRows: 1,
            widths: [28, '*', 90, '*'],
            body: [header, ...rows],
          },
          layout: {
            hLineWidth: (i: number, node: any) =>
              i === 0 || i === 1 || i === node.table.body.length ? 0.6 : 0.4,
            vLineWidth: () => 0,
            hLineColor: () => COLORS.line,
            paddingLeft: () => 2,
            paddingRight: () => 2,
            paddingTop: () => 0,
            paddingBottom: () => 0,
            fillColor: (rowIndex: number) =>
              rowIndex === 0
                ? COLORS.primary
                : rowIndex % 2 === 0
                  ? COLORS.light
                  : null,
          },
        },
      ],
      margin: [0, 0, 0, 14],
    };
  }

  private buildNotes(transfer: InventoryTransferResponseDto): any {
    if (!transfer.notes?.trim()) {
      return { text: '', margin: [0, 0, 0, 0] };
    }

    return {
      stack: [
        {
          text: 'NOTAS',
          fontSize: 8,
          bold: true,
          color: COLORS.muted,
          margin: [0, 0, 0, 6],
        },
        {
          table: {
            widths: ['*'],
            body: [
              [
                {
                  text: transfer.notes.trim(),
                  fontSize: 9,
                  color: COLORS.text,
                  border: [false, false, false, false],
                  fillColor: COLORS.light,
                  margin: [10, 8, 10, 8],
                },
              ],
            ],
          },
          layout: { hLineWidth: () => 0, vLineWidth: () => 0 },
        },
      ],
      margin: [0, 0, 0, 14],
    };
  }

  private buildFooterNote(transfer: InventoryTransferResponseDto): any {
    return {
      stack: [
        {
          canvas: [
            {
              type: 'line',
              x1: 0,
              y1: 0,
              x2: 532,
              y2: 0,
              lineWidth: 0.5,
              lineColor: COLORS.line,
            },
          ],
          margin: [0, 4, 0, 8],
        },
        {
          text: [
            {
              text: 'Trazabilidad: ',
              bold: true,
              color: COLORS.muted,
            },
            {
              text: `cada línea genera un lote nuevo en destino. Folio ${transfer.folio}. Documento generado automáticamente.`,
              color: COLORS.muted,
            },
          ],
          fontSize: 7,
        },
      ],
    };
  }

  private metaCell(label: string, value: string): any {
    return {
      stack: [
        { text: label, fontSize: 7, color: COLORS.muted, margin: [0, 0, 0, 3] },
        { text: value, fontSize: 9, bold: true },
      ],
      border: [false, false, false, false],
      fillColor: COLORS.light,
    };
  }

  private warehouseDetails(
    warehouse?: InventoryTransferResponseDto['source_warehouse'] | null,
  ): string {
    if (!warehouse) return '—';
    const location = [
      warehouse.fiscal_razon_social,
      warehouse.billing_branch_code,
      warehouse.billing_branch_city && warehouse.billing_branch_state
        ? `${warehouse.billing_branch_city}, ${warehouse.billing_branch_state}`
        : warehouse.billing_branch_city || warehouse.billing_branch_state,
    ]
      .filter(Boolean)
      .join(' · ');
    const parts = [
      location || null,
      warehouse.code ? `Almacén: ${warehouse.code}` : null,
      warehouse.fiscal_rfc ? `RFC: ${warehouse.fiscal_rfc}` : null,
    ].filter(Boolean);
    return parts.length ? parts.join('\n') : 'Sin razón social / sucursal';
  }

  private formatQty(value: string | number | null | undefined): string {
    const n = Number(value ?? 0);
    if (Number.isNaN(n)) return String(value ?? '0');
    return n.toLocaleString('es-MX', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    });
  }

  private formatDateTime(value: Date | string): string {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private statusLabel(status: string): string {
    const map: Record<string, string> = {
      completed: 'Completada',
      cancelled: 'Cancelada',
    };
    return map[status] || status || '—';
  }
}
