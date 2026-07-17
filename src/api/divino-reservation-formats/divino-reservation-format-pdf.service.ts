import { Injectable } from '@nestjs/common';
import PdfPrinter from 'pdfmake';
import * as path from 'path';
import { S3Service } from '../../common/services/s3.service';
import { DivinoReservationFormat } from '../../entities/divino-reservation-formats/divino-reservation-format.entity';
import { DIVINO_RESERVATION_BRAND } from './divino-reservation-formats.constants';

const COLORS = {
  primary: '#1F3A2E',
  accent: '#C9A24B',
  text: '#2C3E50',
  muted: '#7F8C8D',
  line: '#B7C2BB',
  light: '#F5F3EE',
};

const LEAD_SOURCE_LABELS: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  google: 'Google',
  restaurante: 'Restaurante',
  walkin: 'Walk-in',
  referido: 'Referido',
  otro: 'Otro',
};

@Injectable()
export class DivinoReservationFormatPdfService {
  private fonts = {
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

  constructor(private readonly s3Service: S3Service) {}

  async generate(format: DivinoReservationFormat): Promise<Buffer> {
    const logoImage = await this.getLogoImage(format);
    const razonSocial =
      format.payable_to ||
      format.fiscal_configuration?.razon_social ||
      DIVINO_RESERVATION_BRAND.defaultPayableTo;

    const docDefinition: any = {
      pageSize: 'LETTER',
      pageMargins: [42, 36, 42, 44],
      defaultStyle: { font: 'Roboto', fontSize: 9, color: COLORS.text },
      content: [
        this.buildHeader(logoImage),
        this.buildTitle(format),
        this.buildIntro(format, razonSocial),
        this.buildPropertySection(format),
        this.buildPaymentPlan(format),
        this.buildLegalText(),
        this.buildBuyerSection(format),
        {
          text: '- Favor de agregar una identificación con fotografía',
          italics: true,
          fontSize: 8,
          color: COLORS.muted,
          margin: [0, 5, 0, 5],
        },
        this.buildLeadSource(format),
        this.buildSignatures(format, razonSocial),
      ],
      footer: () => this.buildFooter(),
      styles: {
        sectionTitle: {
          fontSize: 10,
          bold: true,
          color: COLORS.primary,
          margin: [0, 6, 0, 4],
        },
      },
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

  // --- Secciones ---

  private buildHeader(logoImage: string | null): any {
    const brandStack: any[] = [];
    if (logoImage) {
      brandStack.push({ image: logoImage, fit: [140, 62] });
    } else {
      brandStack.push({
        text: DIVINO_RESERVATION_BRAND.projectName.toUpperCase(),
        fontSize: 21,
        bold: true,
        color: COLORS.primary,
      });
    }

    return {
      columns: [
        { width: '*', stack: brandStack },
        {
          width: 'auto',
          stack: [
            {
              text: DIVINO_RESERVATION_BRAND.address,
              fontSize: 8,
              color: COLORS.muted,
              alignment: 'right',
            },
            {
              text: DIVINO_RESERVATION_BRAND.email,
              fontSize: 8,
              color: COLORS.muted,
              alignment: 'right',
            },
            {
              text: DIVINO_RESERVATION_BRAND.phone,
              fontSize: 8,
              color: COLORS.muted,
              alignment: 'right',
            },
          ],
        },
      ],
      margin: [0, 0, 0, 6],
    };
  }

  private buildTitle(format: DivinoReservationFormat): any {
    return {
      table: {
        widths: ['*'],
        body: [
          [
            {
              columns: [
                {
                  text: 'FORMATO DE RESERVACIÓN',
                  fontSize: 13,
                  bold: true,
                  color: 'white',
                },
                {
                  text: `Folio: ${format.folio}`,
                  fontSize: 9,
                  color: 'white',
                  alignment: 'right',
                  margin: [0, 3, 0, 0],
                },
              ],
              fillColor: COLORS.primary,
              margin: [10, 6, 10, 6],
              border: [false, false, false, false],
            },
          ],
        ],
      },
      layout: {
        hLineWidth: () => 0,
        vLineWidth: () => 0,
      },
      margin: [0, 0, 0, 8],
    };
  }

  private buildIntro(
    format: DivinoReservationFormat,
    razonSocial: string,
  ): any {
    return {
      text: [
        'Recibido de ',
        this.inlineValue(format.received_from),
        ' la suma de ',
        this.inlineValue(format.amount_in_words),
        '. Evidenciado por ',
        this.inlineValue(format.evidenced_by),
        `, pagadero a `,
        { text: razonSocial, bold: true },
        ` por la reservación de la propiedad descrita a continuación, en “${DIVINO_RESERVATION_BRAND.projectName}” ubicado en el ${DIVINO_RESERVATION_BRAND.projectLocation}.`,
      ],
      fontSize: 9,
      lineHeight: 1.25,
      alignment: 'justify',
      margin: [0, 0, 0, 8],
    };
  }

  private buildPropertySection(format: DivinoReservationFormat): any {
    return {
      table: {
        widths: ['33%', '33%', '34%'],
        body: [
          [
            this.fieldCell('Manzana', format.block),
            this.fieldCell('Número de Lote', format.lot_number),
            this.fieldCell(
              'Superficie',
              format.surface != null ? `${this.num(format.surface)} m²` : null,
            ),
          ],
          [
            {
              ...this.fieldCell(
                'Precio de compra',
                this.money(format.purchase_price, format.currency),
              ),
              colSpan: 3,
            },
            {},
            {},
          ],
        ],
      },
      layout: this.cardLayout(),
      margin: [0, 0, 0, 6],
    };
  }

  private buildPaymentPlan(format: DivinoReservationFormat): any {
    const maintenance = this.money(
      format.maintenance_fee,
      format.maintenance_currency,
    );

    return {
      stack: [
        { text: 'Plan de pagos', style: 'sectionTitle' },
        {
          table: {
            widths: ['50%', '50%'],
            body: [
              [
                this.fieldCell(
                  'Depósito de reserva',
                  this.money(format.reservation_deposit, format.currency),
                ),
                this.fieldCell(
                  'Fecha de reserva',
                  this.date(format.reservation_date),
                ),
              ],
              [
                this.fieldCell(
                  'Enganche',
                  this.money(format.down_payment, format.currency),
                ),
                this.fieldCell(
                  'Fecha de pago de enganche',
                  this.date(format.down_payment_date),
                ),
              ],
              [
                this.fieldCell(
                  'Saldo a financiar',
                  this.money(format.financed_balance, format.currency),
                ),
                this.fieldCell(
                  'Años de financiamiento',
                  format.financing_years != null
                    ? String(format.financing_years)
                    : null,
                ),
              ],
              [
                this.fieldCell(
                  'Número de pagos mensuales',
                  format.monthly_payments_count != null
                    ? String(format.monthly_payments_count)
                    : null,
                ),
                this.fieldCell(
                  'Monto de pago mensual',
                  this.money(format.monthly_payment_amount, format.currency),
                ),
              ],
              [
                this.fieldCell('Cuota de mantenimiento', `${maintenance} mensuales`),
                this.fieldCell('Día de pago', this.paymentDayText(format)),
              ],
            ],
          },
          layout: this.cardLayout(),
        },
        {
          text: 'La cuota de mantenimiento inicia el mes siguiente a la firma del contrato de compra-venta. Todos los pagos de enganches/mensualidades y cuotas de mantenimiento serán pagados directamente a la administración.',
          fontSize: 7.5,
          italics: true,
          color: COLORS.muted,
          lineHeight: 1.2,
          margin: [0, 5, 0, 7],
        },
      ],
    };
  }

  private buildLegalText(): any {
    return {
      text: 'La reserva de unidad y términos de compra descritos en este formato son válidos únicamente por 10 días a partir de la firma del mismo, está sujeto a cambios de los términos y condiciones posterior al periodo mencionado. El depósito de apartado es reembolsable antes de los 10 días. Devoluciones de pagos después de los 10 días tendrán un 10% de penalidad. Pueden aplicar cobro de comisiones bancarias dependiendo la forma de pago, los compradores deberán completar el pago y firmar el contrato de compraventa con el vendedor dentro del plazo establecido. El comprador abajo descrito ofrece y acepta comprar la propiedad mencionada anteriormente, así como los términos y condiciones establecidos y acusa de recibido una copia de estos.',
      fontSize: 7,
      color: COLORS.muted,
      alignment: 'justify',
      lineHeight: 1.2,
      margin: [0, 0, 0, 6],
    };
  }

  private buildBuyerSection(format: DivinoReservationFormat): any {
    return {
      stack: [
        { text: 'Datos del comprador', style: 'sectionTitle' },
        {
          table: {
            widths: ['50%', '50%'],
            body: [
              [
                this.fieldCell('Nombre del comprador', format.buyer_name),
                this.fieldCell('Dirección', format.buyer_address),
              ],
              [
                this.fieldCell('Teléfono', format.buyer_phone),
                this.fieldCell('Correo electrónico', format.buyer_email),
              ],
            ],
          },
          layout: this.cardLayout(),
        },
      ],
    };
  }

  private buildLeadSource(format: DivinoReservationFormat): any {
    const options = Object.keys(LEAD_SOURCE_LABELS);
    const marks = options.map((key) => {
      const selected = format.lead_source === key;
      const label =
        key === 'otro' && format.lead_source === 'otro' && format.lead_source_other
          ? `Otro: ${format.lead_source_other}`
          : LEAD_SOURCE_LABELS[key];
      return {
        text: `${selected ? '[X]' : '[  ]'} ${label}`,
        fontSize: 8.5,
        bold: selected,
        color: selected ? COLORS.primary : COLORS.text,
        margin: [0, 0, 8, 0],
      };
    });

    return {
      stack: [
        { text: '¿Cómo se enteró del proyecto?', style: 'sectionTitle' },
        { columns: marks, columnGap: 4, margin: [0, 2, 0, 4] },
      ],
    };
  }

  private buildSignatures(
    format: DivinoReservationFormat,
    razonSocial: string,
  ): any {
    return {
      stack: [
        {
          columns: [
            this.signatureLine('Firma del comprador'),
            this.signatureLine('Reconoce la recepción de fondos'),
          ],
          columnGap: 24,
          margin: [0, 10, 0, 4],
        },
        {
          text: razonSocial,
          fontSize: 9,
          bold: true,
          color: COLORS.primary,
          margin: [0, 6, 0, 8],
        },
        {
          columns: [
            this.fieldCell('Fecha', this.date(format.format_date)),
            this.fieldCell('Agente', format.agent_name),
          ],
          columnGap: 24,
        },
      ],
    };
  }

  private buildFooter(): any {
    return {
      margin: [38, 6, 38, 0],
      stack: [
        {
          canvas: [
            {
              type: 'line',
              x1: 0,
              y1: 0,
              x2: 528,
              y2: 0,
              lineWidth: 0.5,
              lineColor: COLORS.line,
            },
          ],
        },
        {
          columns: [
            {
              text: DIVINO_RESERVATION_BRAND.website,
              fontSize: 8,
              bold: true,
              color: COLORS.primary,
            },
            {
              text: `${DIVINO_RESERVATION_BRAND.facebook}    ${DIVINO_RESERVATION_BRAND.instagram}`,
              fontSize: 8,
              color: COLORS.muted,
              alignment: 'right',
            },
          ],
          margin: [0, 4, 0, 0],
        },
      ],
    };
  }

  // --- Helpers de render ---

  private fieldCell(label: string, value?: string | null): any {
    return {
      stack: [
        { text: label.toUpperCase(), fontSize: 7, color: COLORS.muted },
        {
          text: value && String(value).trim().length > 0 ? String(value) : '—',
          fontSize: 9.5,
          bold: true,
          color: COLORS.text,
          margin: [0, 3, 0, 0],
        },
      ],
      fillColor: COLORS.light,
    };
  }

  private signatureLine(label: string): any {
    return {
      width: '*',
      stack: [
        {
          canvas: [
            {
              type: 'line',
              x1: 0,
              y1: 0,
              x2: 230,
              y2: 0,
              lineWidth: 0.7,
              lineColor: COLORS.line,
            },
          ],
          margin: [0, 16, 0, 4],
        },
        { text: label, fontSize: 8.5, color: COLORS.muted, alignment: 'center' },
      ],
    };
  }

  private inlineValue(value?: string | null): any {
    const text = value && String(value).trim().length > 0 ? String(value) : '________________________';
    return { text, bold: true, color: COLORS.text };
  }

  private cardLayout(): any {
    return {
      hLineWidth: () => 0,
      vLineWidth: () => 0,
      paddingLeft: () => 10,
      paddingRight: () => 10,
      paddingTop: () => 5,
      paddingBottom: () => 5,
      fillColor: (rowIndex: number, node: any, colIndex: number) => {
        return (rowIndex + colIndex) % 2 === 0 ? COLORS.light : '#EFEDE6';
      },
    };
  }

  private paymentDayText(format: DivinoReservationFormat): string | null {
    if (format.payment_day === '1') return '1ro del mes';
    if (format.payment_day === '15') return '15 del mes';
    return null;
  }

  private money(value?: number | null, currency?: string | null): string | null {
    if (value == null) return null;
    const amount = Number(value);
    if (!Number.isFinite(amount)) return null;
    const cur = (currency || 'MXN').toUpperCase();
    return `$${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${cur}`;
  }

  private num(value?: number | null): string {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return '0.00';
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  private date(value?: Date | string | null): string | null {
    if (!value) return null;
    const str = typeof value === 'string' ? value : value.toISOString();
    const datePart = str.split('T')[0];
    const [year, month, day] = datePart.split('-');
    if (!year || !month || !day) return null;
    return `${day}/${month}/${year}`;
  }

  private async getLogoImage(
    format: DivinoReservationFormat,
  ): Promise<string | null> {
    const logoKey = format.fiscal_configuration?.logo;
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
    } catch {
      return null;
    }
  }
}
