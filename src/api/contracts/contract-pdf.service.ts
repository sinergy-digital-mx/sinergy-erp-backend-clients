import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import PdfPrinter from 'pdfmake';
import { Contract } from '../../entities/contracts/contract.entity';
import { Payment } from '../../entities/contracts/payment.entity';
import { ContractDownpaymentPayment } from '../../entities/contracts/contract-downpayment-payment.entity';
import { resolveStoredContractCurrency } from './contract-currency.util';
import { getDownPaymentTarget } from './contract-financial.util';
import { buildStatementTotals, StatementTotals } from './utils/statement-totals.util';
import { resolveLateInterest, resolveLateInterestConfig } from './utils/late-interest.util';

type PdfNode = Record<string, unknown>;
type Alignment = 'left' | 'right' | 'center';
type MoneyFormatter = (amount: number) => string;

type StatementRow = {
  number: string;
  amount: number;
  amount_paid: number;
  amount_pending: number;
  due_date: Date | string | null;
  paid_date: Date | string | null;
  status: string;
  is_overdue: boolean;
  payment_method: string | null;
  late_interest: number | null;
};

const INK = '#1c1917';
const MUTED = '#57534e';
const LINE = '#e7e5e4';
const BAND = '#fafaf9';

@Injectable()
export class ContractPdfService {
  constructor(
    @InjectRepository(Contract)
    private contractRepo: Repository<Contract>,
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    @InjectRepository(ContractDownpaymentPayment)
    private downpaymentRepo: Repository<ContractDownpaymentPayment>,
  ) {}

  async generateContractPdf(tenantId: string, contractId: string): Promise<Buffer> {
    const contract = await this.contractRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.customer', 'customer')
      .leftJoinAndSelect('c.property', 'property')
      .where('c.id = :contractId', { contractId })
      .andWhere('c.tenant_id = :tenantId', { tenantId })
      .getOne();

    if (!contract) {
      throw new Error('Contract not found');
    }

    const currency = resolveStoredContractCurrency(contract.currency);
    const money = (amount: number) => this.formatMoney(amount, currency);

    const [payments, downpayments] = await Promise.all([
      this.paymentRepo
        .createQueryBuilder('p')
        .where('p.contract_id = :contractId', { contractId })
        .andWhere('p.tenant_id = :tenantId', { tenantId })
        .orderBy('p.payment_number', 'ASC')
        .getMany(),
      this.downpaymentRepo
        .createQueryBuilder('d')
        .where('d.contract_id = :contractId', { contractId })
        .andWhere('d.tenant_id = :tenantId', { tenantId })
        .orderBy('d.due_date', 'ASC')
        .addOrderBy('d.payment_number', 'ASC')
        .getMany(),
    ]);

    payments.sort((a, b) => Number(a.payment_number) - Number(b.payment_number));

    const interestConfig = resolveLateInterestConfig(contract);
    const downRows = downpayments.map((payment) => this.toStatementRow(payment));
    const monthlyRows = payments.map((payment) =>
      this.toStatementRow(payment, resolveLateInterest(payment, interestConfig).late_interest_amount),
    );
    const target = getDownPaymentTarget(contract);
    const applied = Number(contract.down_payment || 0);
    const showDownpaymentSection = !!contract.down_payment_financed || downRows.length > 0;
    const totals = buildStatementTotals({ contract, payments, downpayments });

    const fonts = {
      Roboto: {
        normal: './src/_public/fonts/Roboto-Regular.ttf',
        bold: './src/_public/fonts/Roboto-Bold.ttf',
        italics: './src/_public/fonts/Roboto-Italic.ttf',
        bolditalics: './src/_public/fonts/Roboto-BoldItalic.ttf',
      },
    };

    const docDefinition = {
      pageSize: 'LETTER',
      pageMargins: [36, 36, 36, 42],
      defaultStyle: { font: 'Roboto', fontSize: 9, color: INK },
      content: [
        {
          columns: [
            { text: 'Estado de cuenta', fontSize: 18, bold: true, color: INK },
            {
              text: contract.contract_number,
              fontSize: 11,
              alignment: 'right',
              color: MUTED,
              margin: [0, 6, 0, 0],
            },
          ],
        },
        {
          canvas: [{ type: 'line', x1: 0, y1: 8, x2: 540, y2: 8, lineWidth: 0.8, lineColor: INK }],
          margin: [0, 0, 0, 14],
        },
        this.infoBlock(contract),
        this.summaryBlock(contract, money, target, applied, totals),
        ...(showDownpaymentSection
          ? [
              this.sectionTitle('Pagos de enganche'),
              downRows.length
                ? this.paymentsTable(downRows, money)
                : this.emptyLine('Aún no hay pagos de enganche.'),
            ]
          : []),
        this.sectionTitle('Pagos del contrato'),
        monthlyRows.length
          ? this.paymentsTable(monthlyRows, money, true)
          : this.emptyLine('Aún no hay mensualidades.'),
      ],
      footer: (currentPage: number, pageCount: number) => ({
        margin: [36, 0, 36, 16],
        columns: [
          {
            text: `Generado ${this.formatDateTime(new Date())}`,
            fontSize: 8,
            color: MUTED,
          },
          {
            text: `${currentPage} / ${pageCount}`,
            fontSize: 8,
            color: MUTED,
            alignment: 'right',
          },
        ],
      }),
    };

    const printer = new PdfPrinter(fonts);
    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', reject);
      pdfDoc.end();
    });
  }

  private infoBlock(contract: Contract): PdfNode {
    const customer =
      `${contract.customer?.name ?? ''} ${contract.customer?.lastname ?? ''}`.trim() || '—';
    const property = contract.property
      ? `${contract.property.code} · ${contract.property.name}`
      : '—';

    return {
      table: {
        widths: ['*', '*', 90, 80],
        body: [
          [
            this.fact('Cliente', customer),
            this.fact('Lote', property),
            this.fact('Fecha', this.formatDate(contract.contract_date)),
            this.fact('Estado', this.statusLabel(contract.status)),
          ],
        ],
      },
      layout: this.bandLayout(),
      margin: [0, 0, 0, 12],
    };
  }

  private summaryBlock(
    contract: Contract,
    money: MoneyFormatter,
    target: number,
    applied: number,
    totals: StatementTotals,
  ): PdfNode {
    const financed = !!contract.down_payment_financed;
    const thirdLabel = financed ? 'Meta de enganche' : 'A financiar';
    const thirdValue = financed
      ? target > 0
        ? money(target)
        : 'Sin definir'
      : money(Math.max(0, Number(contract.total_price) - applied));
    const overdueLabel =
      totals.overdue_count === 1
        ? 'Total vencido (1)'
        : `Total vencido (${totals.overdue_count})`;

    return {
      stack: [
        {
          table: {
            widths: ['*', '*', '*', '*'],
            body: [
              [
                this.fact('Precio', money(Number(contract.total_price))),
                this.fact(financed ? 'Enganche abonado' : 'Enganche', money(applied)),
                this.fact(thirdLabel, thirdValue),
                this.fact('Saldo pendiente', money(Number(contract.remaining_balance))),
              ],
            ],
          },
          layout: this.bandLayout(),
          margin: [0, 0, 0, 8],
        },
        {
          table: {
            widths: ['*', '*'],
            body: [
              [
                this.fact(overdueLabel, money(totals.overdue_amount)),
                this.fact('Intereses moratorios', money(totals.late_interest_amount)),
              ],
            ],
          },
          layout: this.bandLayout(),
          margin: [0, 0, 0, 16],
        },
      ],
    };
  }

  private fact(label: string, value: string): PdfNode {
    return {
      stack: [
        { text: label.toUpperCase(), fontSize: 7, color: MUTED, margin: [0, 0, 0, 3] },
        { text: value, fontSize: 10, bold: true, color: INK },
      ],
      border: [false, false, false, false],
      fillColor: BAND,
    };
  }

  private sectionTitle(title: string): PdfNode {
    return {
      text: title,
      fontSize: 11,
      bold: true,
      color: INK,
      margin: [0, 4, 0, 6],
    };
  }

  private emptyLine(text: string): PdfNode {
    return {
      text,
      fontSize: 9,
      color: MUTED,
      margin: [0, 0, 0, 12],
    };
  }

  private paymentsTable(
    rows: StatementRow[],
    money: MoneyFormatter,
    showInterest = false,
  ): PdfNode {
    const labels = ['#', 'Vencimiento', 'Pagado el', 'Monto', 'Pagado', 'Pendiente'];
    if (showInterest) labels.push('Interés');
    labels.push('Estado', 'Método');

    const header = labels.map((label) => ({
      text: label,
      bold: true,
      fontSize: 8,
      color: INK,
      alignment:
        label === '#' || label === 'Estado' || label === 'Método' || label === 'Vencimiento' || label === 'Pagado el'
          ? 'left'
          : 'right',
    }));

    const body = rows.map((row) => {
      const cells = [
        this.cell(row.number, 'left'),
        this.cell(this.formatDate(row.due_date), 'left'),
        this.cell(row.paid_date ? this.formatDate(row.paid_date) : '—', 'left'),
        this.cell(money(row.amount), 'right'),
        this.cell(money(row.amount_paid), 'right'),
        this.cell(money(row.amount_pending), 'right'),
      ];
      if (showInterest) cells.push(this.cell(this.interestLabel(row.late_interest, money), 'right'));
      cells.push(
        this.cell(this.paymentStatusLabel(row), 'left'),
        this.cell(this.methodLabel(row.payment_method), 'left'),
      );
      return cells;
    });

    const totals = rows.reduce(
      (sum, row) => ({
        amount: sum.amount + row.amount,
        paid: sum.paid + row.amount_paid,
        pending: sum.pending + row.amount_pending,
        interest: sum.interest + Number(row.late_interest || 0),
      }),
      { amount: 0, paid: 0, pending: 0, interest: 0 },
    );

    const totalCells = [
      this.cell('Total', 'left', true),
      this.cell('', 'left', true),
      this.cell('', 'left', true),
      this.cell(money(totals.amount), 'right', true),
      this.cell(money(totals.paid), 'right', true),
      this.cell(money(totals.pending), 'right', true),
    ];
    if (showInterest) totalCells.push(this.cell(money(totals.interest), 'right', true));
    totalCells.push(this.cell('', 'left', true), this.cell('', 'left', true));
    body.push(totalCells);

    return {
      table: {
        headerRows: 1,
        widths: showInterest
          ? [20, 52, 50, '*', '*', '*', 52, 44, 48]
          : [28, 68, 62, '*', '*', '*', 58, 62],
        body: [header, ...body],
      },
      layout: {
        hLineWidth: (index: number, node: { table: { body: unknown[] } }) =>
          index === 0 || index === 1 || index === node.table.body.length ? 0.8 : 0.3,
        vLineWidth: () => 0,
        hLineColor: () => LINE,
        paddingLeft: () => 3,
        paddingRight: () => 3,
        paddingTop: () => 4,
        paddingBottom: () => 4,
        fillColor: (index: number) => (index > 0 && index % 2 === 0 ? BAND : null),
      },
      margin: [0, 0, 0, 14],
    };
  }

  private cell(text: string, alignment: Alignment, bold = false): PdfNode {
    return { text, fontSize: 8, color: INK, alignment, bold };
  }

  private bandLayout(): PdfNode {
    return {
      hLineWidth: () => 0,
      vLineWidth: () => 0,
      paddingLeft: () => 8,
      paddingRight: () => 8,
      paddingTop: () => 8,
      paddingBottom: () => 8,
    };
  }

  private toStatementRow(
    payment: Payment | ContractDownpaymentPayment,
    lateInterest?: number,
  ): StatementRow {
    return {
      number: String(payment.payment_number),
      amount: Number(payment.amount || 0),
      amount_paid: Number(payment.amount_paid || 0),
      amount_pending: Number(payment.amount_pending || 0),
      due_date: payment.due_date,
      paid_date: payment.paid_date,
      status: payment.status,
      is_overdue: payment.is_overdue,
      payment_method: payment.payment_method,
      late_interest: lateInterest ?? null,
    };
  }

  private interestLabel(amount: number | null, money: MoneyFormatter): string {
    const value = Number(amount || 0);
    return value > 0 ? money(value) : '—';
  }

  private formatMoney(amount: number, currency: string): string {
    const formatted = Number(amount || 0).toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `$${formatted} ${currency}`;
  }

  private formatDate(date: Date | string | null | undefined): string {
    if (!date) return '—';
    if (typeof date === 'string') {
      const [year, month, day] = date.slice(0, 10).split('-');
      if (year && month && day) return `${day}/${month}/${year}`;
    }
    if (date instanceof Date && !Number.isNaN(date.getTime())) {
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      return `${day}/${month}/${year}`;
    }
    return '—';
  }

  private formatDateTime(date: Date): string {
    return date.toLocaleString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private statusLabel(status: string): string {
    const labels: Record<string, string> = {
      activo: 'Activo',
      completado: 'Completado',
      cancelado: 'Cancelado',
      suspendido: 'Suspendido',
    };
    return labels[status] ?? status;
  }

  private paymentStatusLabel(row: StatementRow): string {
    if (row.is_overdue && row.status !== 'pagado' && row.status !== 'cancelado') {
      return 'Vencido';
    }
    const labels: Record<string, string> = {
      pagado: 'Pagado',
      pendiente: 'Pendiente',
      parcial: 'Parcial',
      vencido: 'Vencido',
      cancelado: 'Cancelado',
    };
    return labels[row.status] ?? row.status;
  }

  private methodLabel(method: string | null): string {
    if (!method) return '—';
    const labels: Record<string, string> = {
      efectivo: 'Efectivo',
      transferencia: 'Transferencia',
      tarjeta: 'Tarjeta',
      cheque: 'Cheque',
      deposito: 'Depósito',
      depósito: 'Depósito',
    };
    return labels[method.toLowerCase()] ?? method;
  }
}
