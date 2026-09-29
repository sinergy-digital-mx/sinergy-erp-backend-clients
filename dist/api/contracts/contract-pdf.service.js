"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractPdfService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const pdfmake_1 = __importDefault(require("pdfmake"));
const contract_entity_1 = require("../../entities/contracts/contract.entity");
const payment_entity_1 = require("../../entities/contracts/payment.entity");
const contract_downpayment_payment_entity_1 = require("../../entities/contracts/contract-downpayment-payment.entity");
const contract_currency_util_1 = require("./contract-currency.util");
const contract_financial_util_1 = require("./contract-financial.util");
const INK = '#1c1917';
const MUTED = '#57534e';
const LINE = '#e7e5e4';
const BAND = '#fafaf9';
let ContractPdfService = class ContractPdfService {
    contractRepo;
    paymentRepo;
    downpaymentRepo;
    constructor(contractRepo, paymentRepo, downpaymentRepo) {
        this.contractRepo = contractRepo;
        this.paymentRepo = paymentRepo;
        this.downpaymentRepo = downpaymentRepo;
    }
    async generateContractPdf(tenantId, contractId) {
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
        const currency = (0, contract_currency_util_1.resolveStoredContractCurrency)(contract.currency);
        const money = (amount) => this.formatMoney(amount, currency);
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
        const downRows = downpayments.map((payment) => this.toStatementRow(payment));
        const monthlyRows = payments.map((payment) => this.toStatementRow(payment));
        const target = (0, contract_financial_util_1.getDownPaymentTarget)(contract);
        const applied = Number(contract.down_payment || 0);
        const showDownpaymentSection = !!contract.down_payment_financed || downRows.length > 0;
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
                this.summaryBlock(contract, money, target, applied),
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
                    ? this.paymentsTable(monthlyRows, money)
                    : this.emptyLine('Aún no hay mensualidades.'),
            ],
            footer: (currentPage, pageCount) => ({
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
        const printer = new pdfmake_1.default(fonts);
        const pdfDoc = printer.createPdfKitDocument(docDefinition);
        return new Promise((resolve, reject) => {
            const chunks = [];
            pdfDoc.on('data', (chunk) => chunks.push(chunk));
            pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
            pdfDoc.on('error', reject);
            pdfDoc.end();
        });
    }
    infoBlock(contract) {
        const customer = `${contract.customer?.name ?? ''} ${contract.customer?.lastname ?? ''}`.trim() || '—';
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
    summaryBlock(contract, money, target, applied) {
        const financed = !!contract.down_payment_financed;
        const thirdLabel = financed ? 'Meta de enganche' : 'A financiar';
        const thirdValue = financed
            ? target > 0
                ? money(target)
                : 'Sin definir'
            : money(Math.max(0, Number(contract.total_price) - applied));
        return {
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
            margin: [0, 0, 0, 16],
        };
    }
    fact(label, value) {
        return {
            stack: [
                { text: label.toUpperCase(), fontSize: 7, color: MUTED, margin: [0, 0, 0, 3] },
                { text: value, fontSize: 10, bold: true, color: INK },
            ],
            border: [false, false, false, false],
            fillColor: BAND,
        };
    }
    sectionTitle(title) {
        return {
            text: title,
            fontSize: 11,
            bold: true,
            color: INK,
            margin: [0, 4, 0, 6],
        };
    }
    emptyLine(text) {
        return {
            text,
            fontSize: 9,
            color: MUTED,
            margin: [0, 0, 0, 12],
        };
    }
    paymentsTable(rows, money) {
        const header = ['#', 'Vencimiento', 'Pagado el', 'Monto', 'Pagado', 'Pendiente', 'Estado', 'Método'].map((label) => ({
            text: label,
            bold: true,
            fontSize: 8,
            color: INK,
            alignment: label === '#' || label === 'Estado' || label === 'Método' ? 'left' : 'right',
        }));
        header[0].alignment = 'left';
        header[1].alignment = 'left';
        header[2].alignment = 'left';
        const body = rows.map((row) => [
            this.cell(row.number, 'left'),
            this.cell(this.formatDate(row.due_date), 'left'),
            this.cell(row.paid_date ? this.formatDate(row.paid_date) : '—', 'left'),
            this.cell(money(row.amount), 'right'),
            this.cell(money(row.amount_paid), 'right'),
            this.cell(money(row.amount_pending), 'right'),
            this.cell(this.paymentStatusLabel(row), 'left'),
            this.cell(this.methodLabel(row.payment_method), 'left'),
        ]);
        const totals = rows.reduce((sum, row) => ({
            amount: sum.amount + row.amount,
            paid: sum.paid + row.amount_paid,
            pending: sum.pending + row.amount_pending,
        }), { amount: 0, paid: 0, pending: 0 });
        body.push([
            this.cell('Total', 'left', true),
            this.cell('', 'left', true),
            this.cell('', 'left', true),
            this.cell(money(totals.amount), 'right', true),
            this.cell(money(totals.paid), 'right', true),
            this.cell(money(totals.pending), 'right', true),
            this.cell('', 'left', true),
            this.cell('', 'left', true),
        ]);
        return {
            table: {
                headerRows: 1,
                widths: [28, 68, 62, '*', '*', '*', 58, 62],
                body: [header, ...body],
            },
            layout: {
                hLineWidth: (index, node) => index === 0 || index === 1 || index === node.table.body.length ? 0.8 : 0.3,
                vLineWidth: () => 0,
                hLineColor: () => LINE,
                paddingLeft: () => 3,
                paddingRight: () => 3,
                paddingTop: () => 4,
                paddingBottom: () => 4,
                fillColor: (index) => (index > 0 && index % 2 === 0 ? BAND : null),
            },
            margin: [0, 0, 0, 14],
        };
    }
    cell(text, alignment, bold = false) {
        return { text, fontSize: 8, color: INK, alignment, bold };
    }
    bandLayout() {
        return {
            hLineWidth: () => 0,
            vLineWidth: () => 0,
            paddingLeft: () => 8,
            paddingRight: () => 8,
            paddingTop: () => 8,
            paddingBottom: () => 8,
        };
    }
    toStatementRow(payment) {
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
        };
    }
    formatMoney(amount, currency) {
        const formatted = Number(amount || 0).toLocaleString('es-MX', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
        return `$${formatted} ${currency}`;
    }
    formatDate(date) {
        if (!date)
            return '—';
        if (typeof date === 'string') {
            const [year, month, day] = date.slice(0, 10).split('-');
            if (year && month && day)
                return `${day}/${month}/${year}`;
        }
        if (date instanceof Date && !Number.isNaN(date.getTime())) {
            const year = date.getUTCFullYear();
            const month = String(date.getUTCMonth() + 1).padStart(2, '0');
            const day = String(date.getUTCDate()).padStart(2, '0');
            return `${day}/${month}/${year}`;
        }
        return '—';
    }
    formatDateTime(date) {
        return date.toLocaleString('es-MX', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }
    statusLabel(status) {
        const labels = {
            activo: 'Activo',
            completado: 'Completado',
            cancelado: 'Cancelado',
            suspendido: 'Suspendido',
        };
        return labels[status] ?? status;
    }
    paymentStatusLabel(row) {
        if (row.is_overdue && row.status !== 'pagado' && row.status !== 'cancelado') {
            return 'Vencido';
        }
        const labels = {
            pagado: 'Pagado',
            pendiente: 'Pendiente',
            parcial: 'Parcial',
            vencido: 'Vencido',
            cancelado: 'Cancelado',
        };
        return labels[row.status] ?? row.status;
    }
    methodLabel(method) {
        if (!method)
            return '—';
        const labels = {
            efectivo: 'Efectivo',
            transferencia: 'Transferencia',
            tarjeta: 'Tarjeta',
            cheque: 'Cheque',
            deposito: 'Depósito',
            depósito: 'Depósito',
        };
        return labels[method.toLowerCase()] ?? method;
    }
};
exports.ContractPdfService = ContractPdfService;
exports.ContractPdfService = ContractPdfService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(contract_entity_1.Contract)),
    __param(1, (0, typeorm_1.InjectRepository)(payment_entity_1.Payment)),
    __param(2, (0, typeorm_1.InjectRepository)(contract_downpayment_payment_entity_1.ContractDownpaymentPayment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ContractPdfService);
//# sourceMappingURL=contract-pdf.service.js.map