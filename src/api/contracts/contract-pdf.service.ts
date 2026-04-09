import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import PdfPrinter from 'pdfmake';
import { Contract } from '../../entities/contracts/contract.entity';
import { Payment } from '../../entities/contracts/payment.entity';

@Injectable()
export class ContractPdfService {
  constructor(
    @InjectRepository(Contract)
    private contractRepo: Repository<Contract>,
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
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

    const payments = await this.paymentRepo
      .createQueryBuilder('p')
      .where('p.contract_id = :contractId', { contractId })
      .andWhere('p.tenant_id = :tenantId', { tenantId })
      .orderBy('p.payment_number', 'ASC')
      .getMany();

    // Sort payments by payment_number to ensure correct order
    payments.sort((a, b) => Number(a.payment_number) - Number(b.payment_number));

    const paidPayments = payments.filter(p => p.status === 'pagado');
    const pendingPayments = payments.filter(p => p.status === 'pendiente');
    const partialPayments = payments.filter(p => p.status === 'parcial');
    const overduePayments = payments.filter(p => p.is_overdue && p.status !== 'pagado');

    const totalPaid = paidPayments.reduce((sum, p) => sum + Number(p.amount_paid || 0), 0);
    const totalPending = pendingPayments.reduce((sum, p) => sum + Number(p.amount), 0) +
                         partialPayments.reduce((sum, p) => sum + Number(p.amount_pending || 0), 0);

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
      pageMargins: [30, 30, 30, 30],
      content: [
        // Header compacto
        {
          columns: [
            {
              text: 'ESTADO DE CUENTA',
              fontSize: 18,
              bold: true,
              color: '#2C3E50',
            },
            {
              text: `${contract.contract_number}`,
              fontSize: 11,
              alignment: 'right',
              color: '#7F8C8D',
            },
          ],
          marginBottom: 8,
        },

        // Info básica - card gris
        {
          table: {
            widths: ['25%', '35%', '20%', '20%'],
            body: [
              [
                {
                  stack: [
                    { text: 'CLIENTE', fontSize: 7, color: '#666', marginBottom: 3 },
                    { text: `${contract.customer?.name} ${contract.customer?.lastname}`, fontSize: 9, bold: true },
                  ],
                  border: [false, false, false, false],
                  fillColor: '#F5F5F5',
                },
                {
                  stack: [
                    { text: 'PROPIEDAD', fontSize: 7, color: '#666', marginBottom: 3 },
                    { text: `${contract.property?.code} - ${contract.property?.name}`, fontSize: 9, bold: true },
                  ],
                  border: [false, false, false, false],
                  fillColor: '#F5F5F5',
                },
                {
                  stack: [
                    { text: 'FECHA', fontSize: 7, color: '#666', marginBottom: 3 },
                    { text: this.formatDate(contract.contract_date), fontSize: 9, bold: true },
                  ],
                  border: [false, false, false, false],
                  fillColor: '#F5F5F5',
                },
                {
                  stack: [
                    { text: 'ESTADO', fontSize: 7, color: '#666', marginBottom: 3 },
                    { text: contract.status.toUpperCase(), fontSize: 9, bold: true, color: this.getStatusColor(contract.status) },
                  ],
                  border: [false, false, false, false],
                  fillColor: '#F5F5F5',
                },
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
          marginBottom: 10,
        },

        // Resumen Financiero + Stats de Pagos - un solo card gris con 2 filas
        {
          table: {
            widths: ['*', '*', '*', '*'],
            body: [
              // Primera fila: Resumen Financiero
              [
                {
                  stack: [
                    { text: 'Precio Total', fontSize: 7, color: '#666', marginBottom: 4 },
                    { text: `$${Number(contract.total_price).toFixed(2)}`, fontSize: 11, bold: true },
                  ],
                  alignment: 'center',
                  border: [false, false, false, false],
                  fillColor: '#F5F5F5',
                },
                {
                  stack: [
                    { text: 'Enganche', fontSize: 7, color: '#666', marginBottom: 4 },
                    { text: `$${Number(contract.down_payment).toFixed(2)}`, fontSize: 11, bold: true },
                  ],
                  alignment: 'center',
                  border: [false, false, false, false],
                  fillColor: '#F5F5F5',
                },
                {
                  stack: [
                    { text: 'Financiado', fontSize: 7, color: '#666', marginBottom: 4 },
                    { text: `$${(Number(contract.total_price) - Number(contract.down_payment)).toFixed(2)}`, fontSize: 11, bold: true },
                  ],
                  alignment: 'center',
                  border: [false, false, false, false],
                  fillColor: '#F5F5F5',
                },
                {
                  stack: [
                    { text: 'Saldo Pendiente', fontSize: 7, color: '#666', marginBottom: 4 },
                    { text: `$${Number(contract.remaining_balance).toFixed(2)}`, fontSize: 11, bold: true, color: '#E74C3C' },
                  ],
                  alignment: 'center',
                  border: [false, false, false, false],
                  fillColor: '#F5F5F5',
                },
              ],
              // Segunda fila: Stats de Pagos
              [
                {
                  stack: [
                    { text: paidPayments.length.toString(), fontSize: 16, bold: true, color: '#27AE60', marginBottom: 3 },
                    { text: 'Pagados', fontSize: 8, color: '#27AE60', marginBottom: 4 },
                    { text: `$${totalPaid.toFixed(2)}`, fontSize: 10, bold: true },
                  ],
                  alignment: 'center',
                  border: [false, false, false, false],
                  fillColor: '#F5F5F5',
                },
                {
                  stack: [
                    { text: pendingPayments.length.toString(), fontSize: 16, bold: true, color: '#F39C12', marginBottom: 3 },
                    { text: 'Pendientes', fontSize: 8, color: '#F39C12', marginBottom: 4 },
                    { text: `$${pendingPayments.reduce((sum, p) => sum + Number(p.amount), 0).toFixed(2)}`, fontSize: 10, bold: true },
                  ],
                  alignment: 'center',
                  border: [false, false, false, false],
                  fillColor: '#F5F5F5',
                },
                {
                  stack: [
                    { text: partialPayments.length.toString(), fontSize: 16, bold: true, color: '#3498DB', marginBottom: 3 },
                    { text: 'Parciales', fontSize: 8, color: '#3498DB', marginBottom: 4 },
                    { text: `$${partialPayments.reduce((sum, p) => sum + Number(p.amount_paid || 0), 0).toFixed(2)}`, fontSize: 10, bold: true },
                  ],
                  alignment: 'center',
                  border: [false, false, false, false],
                  fillColor: '#F5F5F5',
                },
                {
                  stack: [
                    { text: overduePayments.length.toString(), fontSize: 16, bold: true, color: '#E74C3C', marginBottom: 3 },
                    { text: 'Vencidos', fontSize: 8, color: '#E74C3C', marginBottom: 4 },
                    { text: `$${overduePayments.reduce((sum, p) => sum + Number(p.amount_pending || p.amount), 0).toFixed(2)}`, fontSize: 10, bold: true },
                  ],
                  alignment: 'center',
                  border: [false, false, false, false],
                  fillColor: '#F5F5F5',
                },
              ],
            ],
          },
          layout: {
            hLineWidth: () => 0,
            vLineWidth: () => 0,
            paddingLeft: () => 12,
            paddingRight: () => 12,
            paddingTop: () => 10,
            paddingBottom: () => 10,
          },
          marginBottom: 12,
        },

        // Tabla de pagos
        {
          text: 'DETALLE DE PAGOS',
          fontSize: 9,
          bold: true,
          color: '#2C3E50',
          marginBottom: 6,
        },
        {
          table: {
            headerRows: 1,
            widths: ['*', '*', '*', '*', '*', '*', '*', '*', '*'],
            body: [
              [
                { text: '#', bold: true, color: 'white', fillColor: '#34495E', alignment: 'center', fontSize: 7 },
                { text: 'Mes', bold: true, color: 'white', fillColor: '#34495E', alignment: 'center', fontSize: 7 },
                { text: 'Monto', bold: true, color: 'white', fillColor: '#34495E', alignment: 'center', fontSize: 7 },
                { text: 'Pagado', bold: true, color: 'white', fillColor: '#34495E', alignment: 'center', fontSize: 7 },
                { text: 'Pendiente', bold: true, color: 'white', fillColor: '#34495E', alignment: 'center', fontSize: 7 },
                { text: 'Vencimiento', bold: true, color: 'white', fillColor: '#34495E', alignment: 'center', fontSize: 7 },
                { text: 'Pagado En', bold: true, color: 'white', fillColor: '#34495E', alignment: 'center', fontSize: 7 },
                { text: 'Estado', bold: true, color: 'white', fillColor: '#34495E', alignment: 'center', fontSize: 7 },
                { text: 'Método', bold: true, color: 'white', fillColor: '#34495E', alignment: 'center', fontSize: 7 },
              ],
              ...payments.map((payment) => [
                { text: payment.payment_number.toString(), fontSize: 6, alignment: 'center' },
                { text: payment.payment_number.toString(), fontSize: 6, alignment: 'center' },
                { text: `$${Number(payment.amount).toFixed(2)}`, fontSize: 6, alignment: 'right' },
                { text: `$${Number(payment.amount_paid || 0).toFixed(2)}`, fontSize: 6, alignment: 'right' },
                { text: `$${Number(payment.amount_pending || 0).toFixed(2)}`, fontSize: 6, alignment: 'right' },
                { text: this.formatDate(payment.due_date), fontSize: 6, alignment: 'center' },
                { text: payment.paid_date ? this.formatDate(payment.paid_date) : '—', fontSize: 6, alignment: 'center' },
                {
                  text: this.getPaymentStatusText(payment.status),
                  fontSize: 6,
                  alignment: 'center',
                  color: this.getPaymentStatusColor(payment.status),
                  bold: true,
                },
                { text: payment.payment_method || '—', fontSize: 6, alignment: 'center' },
              ]),
            ],
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => '#ECF0F1',
            vLineColor: () => '#ECF0F1',
            paddingLeft: () => 2,
            paddingRight: () => 2,
            paddingTop: () => 1,
            paddingBottom: () => 1,
          },
        },

        // Footer
        {
          text: `Generado: ${new Date().toLocaleString('es-MX')}`,
          fontSize: 7,
          color: '#BDC3C7',
          alignment: 'center',
          marginTop: 10,
        },
      ],
    };

    const printer = new PdfPrinter(fonts);
    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', reject);
      pdfDoc.end();
    });
  }

  private formatDate(date: any): string {
    if (!date) return '—';
    const dateStr = typeof date === 'string' ? date : date.toISOString();
    const [year, month, day] = dateStr.split('T')[0].split('-');
    return `${day}/${month}/${year}`;
  }

  private getStatusColor(status: string): string {
    switch (status) {
      case 'activo':
        return '#27AE60';
      case 'completado':
        return '#3498DB';
      case 'cancelado':
        return '#E74C3C';
      case 'suspendido':
        return '#F39C12';
      default:
        return '#2C3E50';
    }
  }

  private getPaymentStatusText(status: string): string {
    switch (status) {
      case 'pagado':
        return 'Pagado';
      case 'pendiente':
        return 'Pendiente';
      case 'parcial':
        return 'Parcial';
      case 'vencido':
        return 'Vencido';
      default:
        return status;
    }
  }

  private getPaymentStatusColor(status: string): string {
    switch (status) {
      case 'pagado':
        return '#27AE60';
      case 'pendiente':
        return '#F39C12';
      case 'parcial':
        return '#3498DB';
      case 'vencido':
        return '#E74C3C';
      default:
        return '#2C3E50';
    }
  }
}
