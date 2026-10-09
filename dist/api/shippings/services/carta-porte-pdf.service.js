"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartaPortePdfService = void 0;
const common_1 = require("@nestjs/common");
const pdfmake_1 = __importDefault(require("pdfmake"));
const path = __importStar(require("path"));
const carta_porte_service_1 = require("./carta-porte.service");
let CartaPortePdfService = class CartaPortePdfService {
    cartaPorte;
    fonts = {
        Roboto: {
            normal: path.join(process.cwd(), 'src/_public/fonts/Roboto-Regular.ttf'),
            bold: path.join(process.cwd(), 'src/_public/fonts/Roboto-Bold.ttf'),
            italics: path.join(process.cwd(), 'src/_public/fonts/Roboto-Italic.ttf'),
            bolditalics: path.join(process.cwd(), 'src/_public/fonts/Roboto-BoldItalic.ttf'),
        },
    };
    constructor(cartaPorte) {
        this.cartaPorte = cartaPorte;
    }
    async generate(id, tenantId) {
        const shipping = await this.cartaPorte.loadForPdf(id, tenantId);
        const buffer = await this.render(shipping);
        const folio = shipping.carta_porte_uuid?.slice(0, 8) || shipping.id.slice(0, 8);
        return { buffer, filename: `carta-porte-${folio}.pdf` };
    }
    render(shipping) {
        const printer = new pdfmake_1.default(this.fonts);
        const driver = [shipping.driver?.first_name, shipping.driver?.last_name]
            .filter(Boolean)
            .join(' ');
        const stops = [...(shipping.stops ?? [])].sort((a, b) => (a.stop_sequence ?? 0) - (b.stop_sequence ?? 0));
        const doc = {
            pageSize: 'LETTER',
            pageMargins: [40, 40, 40, 40],
            content: [
                { text: 'Carta porte', style: 'title' },
                { text: 'CFDI de traslado con complemento Carta Porte 3.1', style: 'muted' },
                {
                    margin: [0, 12, 0, 0],
                    table: {
                        widths: ['*', '*'],
                        body: [
                            ['UUID', shipping.carta_porte_uuid || '—'],
                            ['IdCCP', shipping.carta_porte_idccp || '—'],
                            ['Fecha de timbrado', formatDate(shipping.carta_porte_stamped_at)],
                            ['Viaje', shipping.id.slice(0, 8).toUpperCase()],
                            ['Salida', dateOnly(shipping.shipping_date)],
                            ['Kilómetros', shipping.distance_km != null ? String(shipping.distance_km) : '—'],
                            ['Peso bruto (kg)', shipping.carta_porte_peso_kg != null ? String(shipping.carta_porte_peso_kg) : '—'],
                        ],
                    },
                    layout: 'lightHorizontalLines',
                },
                { text: 'Transporte', style: 'section' },
                {
                    ul: [
                        `Chofer: ${driver || '—'}`,
                        `Licencia: ${shipping.driver?.driver_license_number || '—'}`,
                        `RFC chofer: ${shipping.driver?.driver_rfc || '—'}`,
                        `Unidad: ${shipping.truck?.name || '—'} · ${shipping.truck?.placa || '—'}`,
                        `Configuración: ${shipping.truck?.tipo_auto_transporte || '—'}`,
                        `Permiso SCT: ${shipping.truck?.permiso_sct || '—'} ${shipping.truck?.numero_permiso_sct || ''}`.trim(),
                    ],
                },
                { text: 'Destinos', style: 'section' },
                {
                    ol: stops.map((stop) => {
                        const customer = stop.sales_order?.customer;
                        const name = customer?.fiscal_razon_social ||
                            [customer?.name, customer?.lastname].filter(Boolean).join(' ') ||
                            'Cliente';
                        const address = stop.customer_address;
                        const line = [address?.street_address, address?.city, address?.state, address?.postal_code]
                            .filter(Boolean)
                            .join(', ');
                        return `${stop.sales_order?.folio || 'Orden'} · ${name}${line ? ` · ${line}` : ''}`;
                    }),
                },
            ],
            styles: {
                title: { fontSize: 18, bold: true, color: '#111827' },
                muted: { fontSize: 10, color: '#6b7280', margin: [0, 2, 0, 0] },
                section: { fontSize: 12, bold: true, margin: [0, 14, 0, 6] },
            },
            defaultStyle: { fontSize: 10, color: '#111827' },
        };
        return new Promise((resolve, reject) => {
            const pdf = printer.createPdfKitDocument(doc);
            const chunks = [];
            pdf.on('data', (chunk) => chunks.push(chunk));
            pdf.on('end', () => resolve(Buffer.concat(chunks)));
            pdf.on('error', reject);
            pdf.end();
        });
    }
};
exports.CartaPortePdfService = CartaPortePdfService;
exports.CartaPortePdfService = CartaPortePdfService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [carta_porte_service_1.CartaPorteService])
], CartaPortePdfService);
function dateOnly(value) {
    if (!value)
        return '—';
    if (typeof value === 'string')
        return value.slice(0, 10);
    return value.toISOString().slice(0, 10);
}
function formatDate(value) {
    if (!value)
        return '—';
    return value.toISOString().replace('T', ' ').slice(0, 19);
}
//# sourceMappingURL=carta-porte-pdf.service.js.map