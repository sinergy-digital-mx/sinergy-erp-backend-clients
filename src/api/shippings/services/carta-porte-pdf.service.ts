import { Injectable } from '@nestjs/common';
import PdfPrinter from 'pdfmake';
import * as path from 'path';
import { Shipping } from '../../../entities/logistics/shipping.entity';
import { CartaPorteService } from './carta-porte.service';

@Injectable()
export class CartaPortePdfService {
    private readonly fonts = {
        Roboto: {
            normal: path.join(process.cwd(), 'src/_public/fonts/Roboto-Regular.ttf'),
            bold: path.join(process.cwd(), 'src/_public/fonts/Roboto-Bold.ttf'),
            italics: path.join(process.cwd(), 'src/_public/fonts/Roboto-Italic.ttf'),
            bolditalics: path.join(process.cwd(), 'src/_public/fonts/Roboto-BoldItalic.ttf'),
        },
    };
    constructor(private readonly cartaPorte: CartaPorteService) {}
    async generate(
        id: string,
        tenantId: string,
    ): Promise<{ buffer: Buffer; filename: string }> {
        const shipping = await this.cartaPorte.loadForPdf(id, tenantId);
        const buffer = await this.render(shipping);
        const folio = shipping.carta_porte_uuid?.slice(0, 8) || shipping.id.slice(0, 8);
        return { buffer, filename: `carta-porte-${folio}.pdf` };
    }
    private render(shipping: Shipping): Promise<Buffer> {
        const printer = new PdfPrinter(this.fonts);
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
                ...(shipping.carta_porte_environment === 'demo'
                    ? [{ text: 'Timbrada en Finkok Demo. No tiene validez fiscal.', style: 'demo' }]
                    : []),
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
                            ['Ambiente', environmentLabel(shipping.carta_porte_environment)],
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
                demo: { fontSize: 10, bold: true, color: '#9a3412', margin: [0, 6, 0, 0] },
                section: { fontSize: 12, bold: true, margin: [0, 14, 0, 6] },
            },
            defaultStyle: { fontSize: 10, color: '#111827' },
        };
        return new Promise((resolve, reject) => {
            const pdf = printer.createPdfKitDocument(doc);
            const chunks: Buffer[] = [];
            pdf.on('data', (chunk: Buffer) => chunks.push(chunk));
            pdf.on('end', () => resolve(Buffer.concat(chunks)));
            pdf.on('error', reject);
            pdf.end();
        });
    }
}
function environmentLabel(value: Shipping['carta_porte_environment']): string {
    if (value === 'demo')
        return 'Demo';
    if (value === 'production')
        return 'Producción';
    return '—';
}
function dateOnly(value: Date | string | null | undefined): string {
    if (!value)
        return '—';
    if (typeof value === 'string')
        return value.slice(0, 10);
    return value.toISOString().slice(0, 10);
}
function formatDate(value: Date | null | undefined): string {
    if (!value)
        return '—';
    return value.toISOString().replace('T', ' ').slice(0, 19);
}
