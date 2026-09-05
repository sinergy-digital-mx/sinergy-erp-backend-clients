"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_SAT_CLAVE_UNIDAD = exports.DEFAULT_SAT_CLAVE_PROD_SERV = exports.SAT_CLAVE_UNIDAD_BY_UOM = exports.SELF_INVOICE_CATALOGS = exports.SELF_INVOICE_FORMA_PAGO = exports.SELF_INVOICE_REGIMEN_RECEPTOR = exports.SELF_INVOICE_USO_CFDI = void 0;
exports.SELF_INVOICE_USO_CFDI = [
    { value: 'G01', label: 'G01 — Adquisición de mercancías' },
    { value: 'G03', label: 'G03 — Gastos en general' },
    { value: 'I01', label: 'I01 — Construcciones' },
    { value: 'I02', label: 'I02 — Mobiliario y equipo de oficina' },
    { value: 'I03', label: 'I03 — Equipo de transporte' },
    { value: 'I04', label: 'I04 — Equipo de cómputo' },
    { value: 'I08', label: 'I08 — Otra maquinaria y equipo' },
    { value: 'D01', label: 'D01 — Honorarios médicos' },
    { value: 'S01', label: 'S01 — Sin efectos fiscales' },
];
exports.SELF_INVOICE_REGIMEN_RECEPTOR = [
    { value: '601', label: '601 — General de Ley Personas Morales' },
    { value: '603', label: '603 — Personas Morales con Fines no Lucrativos' },
    { value: '605', label: '605 — Sueldos y Salarios' },
    { value: '606', label: '606 — Arrendamiento' },
    { value: '608', label: '608 — Demás ingresos' },
    { value: '612', label: '612 — Personas Físicas con Actividades Empresariales' },
    { value: '616', label: '616 — Sin obligaciones fiscales' },
    { value: '621', label: '621 — Incorporación Fiscal' },
    { value: '625', label: '625 — Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas' },
    { value: '626', label: '626 — Régimen Simplificado de Confianza' },
];
exports.SELF_INVOICE_FORMA_PAGO = [
    { value: '01', label: '01 — Efectivo' },
    { value: '03', label: '03 — Transferencia electrónica' },
    { value: '04', label: '04 — Tarjeta de crédito' },
    { value: '28', label: '28 — Tarjeta de débito' },
    { value: '99', label: '99 — Por definir' },
];
exports.SELF_INVOICE_CATALOGS = {
    uso_cfdi: exports.SELF_INVOICE_USO_CFDI,
    regimen_fiscal_receptor: exports.SELF_INVOICE_REGIMEN_RECEPTOR,
    forma_pago: exports.SELF_INVOICE_FORMA_PAGO,
    metodo_pago: [
        { value: 'PUE', label: 'PUE — Pago en una sola exhibición' },
        { value: 'PPD', label: 'PPD — Pago en parcialidades o diferido' },
    ],
};
exports.SAT_CLAVE_UNIDAD_BY_UOM = {
    PIEZA: 'H87',
    PIEZAS: 'H87',
    PZ: 'H87',
    PZA: 'H87',
    'PZA.': 'H87',
    UNIT: 'H87',
    UNIDAD: 'H87',
    SERVICIO: 'E48',
    SERVICIOS: 'E48',
    SERVICE: 'E48',
    SERV: 'E48',
    E48: 'E48',
    KG: 'KGM',
    KGS: 'KGM',
    KILO: 'KGM',
    KILOGRAMO: 'KGM',
    M: 'MTR',
    MT: 'MTR',
    MTS: 'MTR',
    METRO: 'MTR',
    METROS: 'MTR',
    L: 'LTR',
    LT: 'LTR',
    LTS: 'LTR',
    LITRO: 'LTR',
    LITROS: 'LTR',
};
exports.DEFAULT_SAT_CLAVE_PROD_SERV = '01010101';
exports.DEFAULT_SAT_CLAVE_UNIDAD = 'H87';
//# sourceMappingURL=self-invoice.constants.js.map