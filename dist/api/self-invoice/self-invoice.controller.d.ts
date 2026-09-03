import { SelfInvoiceService } from './self-invoice.service';
import { IdentifySelfInvoiceDto } from './dto/identify-self-invoice.dto';
import { StampSelfInvoiceDto } from './dto/stamp-self-invoice.dto';
export declare class SelfInvoiceController {
    private readonly selfInvoiceService;
    constructor(selfInvoiceService: SelfInvoiceService);
    getReceipt(code: string): Promise<{
        code: string | null;
        issuer_name: string | null;
        branch_name: string | null;
        sold_at: Date;
        total: number;
        currency: string;
        already_invoiced: boolean;
        invoice: {
            id: string;
            uuid: string | null;
            stamped_at: Date | null;
            pdf_url: string | null;
            pdf_file_name: string | null;
        } | null;
        catalogs: {
            uso_cfdi: readonly [{
                readonly value: "G01";
                readonly label: "G01 — Adquisición de mercancías";
            }, {
                readonly value: "G03";
                readonly label: "G03 — Gastos en general";
            }, {
                readonly value: "I01";
                readonly label: "I01 — Construcciones";
            }, {
                readonly value: "I02";
                readonly label: "I02 — Mobiliario y equipo de oficina";
            }, {
                readonly value: "I03";
                readonly label: "I03 — Equipo de transporte";
            }, {
                readonly value: "I04";
                readonly label: "I04 — Equipo de cómputo";
            }, {
                readonly value: "I08";
                readonly label: "I08 — Otra maquinaria y equipo";
            }, {
                readonly value: "D01";
                readonly label: "D01 — Honorarios médicos";
            }, {
                readonly value: "S01";
                readonly label: "S01 — Sin efectos fiscales";
            }];
            regimen_fiscal_receptor: readonly [{
                readonly value: "601";
                readonly label: "601 — General de Ley Personas Morales";
            }, {
                readonly value: "603";
                readonly label: "603 — Personas Morales con Fines no Lucrativos";
            }, {
                readonly value: "605";
                readonly label: "605 — Sueldos y Salarios";
            }, {
                readonly value: "606";
                readonly label: "606 — Arrendamiento";
            }, {
                readonly value: "608";
                readonly label: "608 — Demás ingresos";
            }, {
                readonly value: "612";
                readonly label: "612 — Personas Físicas con Actividades Empresariales";
            }, {
                readonly value: "616";
                readonly label: "616 — Sin obligaciones fiscales";
            }, {
                readonly value: "621";
                readonly label: "621 — Incorporación Fiscal";
            }, {
                readonly value: "625";
                readonly label: "625 — Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas";
            }, {
                readonly value: "626";
                readonly label: "626 — Régimen Simplificado de Confianza";
            }];
            forma_pago: readonly [{
                readonly value: "01";
                readonly label: "01 — Efectivo";
            }, {
                readonly value: "03";
                readonly label: "03 — Transferencia electrónica";
            }, {
                readonly value: "04";
                readonly label: "04 — Tarjeta de crédito";
            }, {
                readonly value: "28";
                readonly label: "28 — Tarjeta de débito";
            }, {
                readonly value: "99";
                readonly label: "99 — Por definir";
            }];
            metodo_pago: {
                value: string;
                label: string;
            }[];
        };
    }>;
    identify(code: string, dto: IdentifySelfInvoiceDto): Promise<{
        matched: boolean;
        code: string | null;
        total: number;
        currency: string;
        issuer_name: string | null;
        already_invoiced: boolean;
        fiscal: {
            fiscal_rfc: string;
            fiscal_person_type: string;
            fiscal_razon_social: string;
            fiscal_postal_code: string;
            fiscal_country: string;
            fiscal_street: string;
            fiscal_exterior_number: string;
            fiscal_interior_number: string;
            fiscal_colonia: string;
            fiscal_localidad: string;
            fiscal_municipio: string;
            fiscal_state: string;
        } | null;
        suggested: {
            uso_cfdi: string;
            regimen_fiscal_receptor: string;
            forma_pago: string;
            metodo_pago: string;
        };
    }>;
    stamp(code: string, dto: StampSelfInvoiceDto): Promise<{
        code: string | null;
        uuid: string | null;
        stamp_status: import("../../entities/electronic-invoicing/electronic-invoice.entity").ElectronicInvoiceStampStatus;
        total: number;
        pdf_url: string;
        pdf_file_name: string;
        invoice_id: string;
    }>;
    getPdf(code: string): Promise<import("../electronic-invoicing/services/electronic-invoice-pdf.service").ElectronicInvoicePdfUploadResult>;
    getXml(code: string, res: any): Promise<void>;
}
