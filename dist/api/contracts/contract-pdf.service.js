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
const contract_currency_util_1 = require("./contract-currency.util");
let ContractPdfService = class ContractPdfService {
    contractRepo;
    paymentRepo;
    constructor(contractRepo, paymentRepo) {
        this.contractRepo = contractRepo;
        this.paymentRepo = paymentRepo;
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
        const payments = await this.paymentRepo
            .createQueryBuilder('p')
            .where('p.contract_id = :contractId', { contractId })
            .andWhere('p.tenant_id = :tenantId', { tenantId })
            .orderBy('p.payment_number', 'ASC')
            .getMany();
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
                {
                    columns: [
                        {
                            text: 'ESTADO DE CUENTA',
                            fontSize: 18,
                            bold: true,
                            color: '#2C3E50',
                        },
                        {
                            text: `${contract.contract_number} · ${currency}`,
                            fontSize: 11,
                            alignment: 'right',
                            color: '#7F8C8D',
                        },
                    ],
                    marginBottom: 8,
                },
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
                {
                    table: {
                        widths: ['*', '*', '*', '*'],
                        body: [
                            [
                                {
                                    stack: [
                                        { text: 'Precio Total', fontSize: 7, color: '#666', marginBottom: 4 },
                                        { text: money(Number(contract.total_price)), fontSize: 11, bold: true },
                                    ],
                                    alignment: 'center',
                                    border: [false, false, false, false],
                                    fillColor: '#F5F5F5',
                                },
                                {
                                    stack: [
                                        { text: 'Enganche', fontSize: 7, color: '#666', marginBottom: 4 },
                                        { text: money(Number(contract.down_payment)), fontSize: 11, bold: true },
                                    ],
                                    alignment: 'center',
                                    border: [false, false, false, false],
                                    fillColor: '#F5F5F5',
                                },
                                {
                                    stack: [
                                        { text: 'Financiado', fontSize: 7, color: '#666', marginBottom: 4 },
                                        { text: money(Number(contract.total_price) - Number(contract.down_payment)), fontSize: 11, bold: true },
                                    ],
                                    alignment: 'center',
                                    border: [false, false, false, false],
                                    fillColor: '#F5F5F5',
                                },
                                {
                                    stack: [
                                        { text: 'Saldo Pendiente', fontSize: 7, color: '#666', marginBottom: 4 },
                                        { text: money(Number(contract.remaining_balance)), fontSize: 11, bold: true, color: '#E74C3C' },
                                    ],
                                    alignment: 'center',
                                    border: [false, false, false, false],
                                    fillColor: '#F5F5F5',
                                },
                            ],
                            [
                                {
                                    stack: [
                                        { text: paidPayments.length.toString(), fontSize: 16, bold: true, color: '#27AE60', marginBottom: 3 },
                                        { text: 'Pagados', fontSize: 8, color: '#27AE60', marginBottom: 4 },
                                        { text: money(totalPaid), fontSize: 10, bold: true },
                                    ],
                                    alignment: 'center',
                                    border: [false, false, false, false],
                                    fillColor: '#F5F5F5',
                                },
                                {
                                    stack: [
                                        { text: pendingPayments.length.toString(), fontSize: 16, bold: true, color: '#F39C12', marginBottom: 3 },
                                        { text: 'Pendientes', fontSize: 8, color: '#F39C12', marginBottom: 4 },
                                        { text: money(pendingPayments.reduce((sum, p) => sum + Number(p.amount), 0)), fontSize: 10, bold: true },
                                    ],
                                    alignment: 'center',
                                    border: [false, false, false, false],
                                    fillColor: '#F5F5F5',
                                },
                                {
                                    stack: [
                                        { text: partialPayments.length.toString(), fontSize: 16, bold: true, color: '#3498DB', marginBottom: 3 },
                                        { text: 'Parciales', fontSize: 8, color: '#3498DB', marginBottom: 4 },
                                        { text: money(partialPayments.reduce((sum, p) => sum + Number(p.amount_paid || 0), 0)), fontSize: 10, bold: true },
                                    ],
                                    alignment: 'center',
                                    border: [false, false, false, false],
                                    fillColor: '#F5F5F5',
                                },
                                {
                                    stack: [
                                        { text: overduePayments.length.toString(), fontSize: 16, bold: true, color: '#E74C3C', marginBottom: 3 },
                                        { text: 'Vencidos', fontSize: 8, color: '#E74C3C', marginBottom: 4 },
                                        { text: money(overduePayments.reduce((sum, p) => sum + Number(p.amount_pending || p.amount), 0)), fontSize: 10, bold: true },
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
                                { text: money(Number(payment.amount)), fontSize: 6, alignment: 'right' },
                                { text: money(Number(payment.amount_paid || 0)), fontSize: 6, alignment: 'right' },
                                { text: money(Number(payment.amount_pending || 0)), fontSize: 6, alignment: 'right' },
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
                {
                    text: `Generado: ${new Date().toLocaleString('es-MX')}`,
                    fontSize: 7,
                    color: '#BDC3C7',
                    alignment: 'center',
                    marginTop: 10,
                },
            ],
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
    formatMoney(amount, currency) {
        return `$${Number(amount || 0).toFixed(2)} ${currency}`;
    }
    formatDate(date) {
        if (!date)
            return '—';
        const dateStr = typeof date === 'string' ? date : date.toISOString();
        const [year, month, day] = dateStr.split('T')[0].split('-');
        return `${day}/${month}/${year}`;
    }
    getStatusColor(status) {
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
    getPaymentStatusText(status) {
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
    getPaymentStatusColor(status) {
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
};
exports.ContractPdfService = ContractPdfService;
exports.ContractPdfService = ContractPdfService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(contract_entity_1.Contract)),
    __param(1, (0, typeorm_1.InjectRepository)(payment_entity_1.Payment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ContractPdfService);
//# sourceMappingURL=contract-pdf.service.js.map