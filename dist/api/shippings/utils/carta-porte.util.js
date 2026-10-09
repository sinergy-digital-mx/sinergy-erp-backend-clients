"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDriverFlag = isDriverFlag;
exports.assessDriver = assessDriver;
exports.assessTruck = assessTruck;
exports.normalizeRfc = normalizeRfc;
exports.normalizeLicense = normalizeLicense;
exports.isValidRfc = isValidRfc;
exports.buildIdCcp = buildIdCcp;
exports.satStateCode = satStateCode;
exports.postalCode = postalCode;
exports.plateCode = plateCode;
exports.escapeXml = escapeXml;
exports.kg = kg;
exports.money0 = money0;
exports.decorateShippingCartaPorte = decorateShippingCartaPorte;
exports.splitWeightKg = splitWeightKg;
const crypto_1 = require("crypto");
const RFC_PATTERN = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/i;
const STATE_CODES = {
    agu: 'AGU',
    aguascalientes: 'AGU',
    bcn: 'BCN',
    bc: 'BCN',
    bajacalifornia: 'BCN',
    bcs: 'BCS',
    bajacaliforniasur: 'BCS',
    cam: 'CAM',
    campeche: 'CAM',
    chp: 'CHP',
    chiapas: 'CHP',
    chh: 'CHH',
    chihuahua: 'CHH',
    cmx: 'CMX',
    dif: 'CMX',
    cdmx: 'CMX',
    ciudaddemexico: 'CMX',
    distritofederal: 'CMX',
    coa: 'COA',
    coahuila: 'COA',
    col: 'COL',
    colima: 'COL',
    dur: 'DUR',
    durango: 'DUR',
    gua: 'GUA',
    guanajuato: 'GUA',
    gro: 'GRO',
    guerrero: 'GRO',
    hid: 'HID',
    hidalgo: 'HID',
    jal: 'JAL',
    jalisco: 'JAL',
    mex: 'MEX',
    mexico: 'MEX',
    estadodemexico: 'MEX',
    edomex: 'MEX',
    mic: 'MIC',
    michoacan: 'MIC',
    mor: 'MOR',
    morelos: 'MOR',
    nay: 'NAY',
    nayarit: 'NAY',
    nle: 'NLE',
    nuevoleon: 'NLE',
    oax: 'OAX',
    oaxaca: 'OAX',
    pue: 'PUE',
    puebla: 'PUE',
    que: 'QUE',
    queretaro: 'QUE',
    roo: 'ROO',
    quintanaroo: 'ROO',
    slp: 'SLP',
    sanluispotosi: 'SLP',
    sin: 'SIN',
    sinaloa: 'SIN',
    son: 'SON',
    sonora: 'SON',
    tab: 'TAB',
    tabasco: 'TAB',
    tam: 'TAM',
    tamaulipas: 'TAM',
    tla: 'TLA',
    tlaxcala: 'TLA',
    ver: 'VER',
    veracruz: 'VER',
    yuc: 'YUC',
    yucatan: 'YUC',
    zac: 'ZAC',
    zacatecas: 'ZAC',
};
function isDriverFlag(value) {
    return value === true || value === 1 || value === '1';
}
function assessDriver(input) {
    const missing = [];
    if (!input || !isDriverFlag(input.is_driver)) {
        missing.push('El usuario no está marcado como chofer');
        return { ready: false, missing };
    }
    const name = [input.first_name, input.last_name].filter(Boolean).join(' ').trim();
    if (!name)
        missing.push('Falta el nombre del chofer');
    const license = (input.driver_license_number ?? '').trim();
    if (license.length < 5)
        missing.push('Falta el número de licencia');
    const rfc = (input.driver_rfc ?? '').trim();
    if (!RFC_PATTERN.test(rfc))
        missing.push('Falta un RFC válido del chofer');
    return { ready: missing.length === 0, missing };
}
function assessTruck(input) {
    const missing = [];
    if (!input) {
        return { ready: false, missing: ['Falta la unidad'] };
    }
    if (!(input.placa ?? '').trim())
        missing.push('Falta la placa');
    if (!/^\d{4}$/.test((input.anio ?? '').trim()))
        missing.push('Falta el año del vehículo (4 dígitos)');
    if (!(input.permiso_sct ?? '').trim())
        missing.push('Falta el permiso SCT');
    if (!(input.numero_permiso_sct ?? '').trim())
        missing.push('Falta el número de permiso SCT');
    if (!(input.tipo_auto_transporte ?? '').trim()) {
        missing.push('Falta la configuración vehicular');
    }
    const peso = Number(input.peso_bruto_vehicular);
    if (!Number.isFinite(peso) || peso <= 0) {
        missing.push('Falta el peso bruto vehicular en toneladas');
    }
    if (!(input.aseguradora_rc ?? '').trim())
        missing.push('Falta la aseguradora de responsabilidad civil');
    if (!(input.poliza_rc ?? '').trim())
        missing.push('Falta la póliza de responsabilidad civil');
    const trailerType = (input.subtipo_remolque1 ?? '').trim();
    const trailerPlate = (input.placa_remolque1 ?? '').trim();
    if (trailerType && !trailerPlate)
        missing.push('Falta la placa del remolque');
    if (trailerPlate && !trailerType)
        missing.push('Falta el subtipo del remolque');
    return { ready: missing.length === 0, missing };
}
function normalizeRfc(value) {
    return (value ?? '').trim().toUpperCase();
}
function normalizeLicense(value) {
    return (value ?? '').trim().toUpperCase();
}
function isValidRfc(value) {
    return RFC_PATTERN.test((value ?? '').trim());
}
function buildIdCcp() {
    const hex = (0, crypto_1.randomBytes)(16).toString('hex').toUpperCase();
    return `CCC${hex.slice(0, 5)}-${hex.slice(5, 9)}-${hex.slice(9, 13)}-${hex.slice(13, 17)}-${hex.slice(17, 29)}`;
}
function satStateCode(value) {
    const raw = (value ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z]/g, '')
        .toLowerCase();
    if (!raw)
        return null;
    return STATE_CODES[raw] ?? null;
}
function postalCode(value) {
    const digits = (value ?? '').replace(/\D/g, '');
    return digits.length === 5 ? digits : null;
}
function plateCode(value) {
    return (value ?? '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}
function escapeXml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
function kg(value) {
    return value.toFixed(3);
}
function money0() {
    return '0.00';
}
function decorateShippingCartaPorte(shipping) {
    const driver = assessDriver(shipping.driver);
    const truck = assessTruck(shipping.truck);
    const view = Object.assign(shipping, {
        driver_carta_porte_ready: driver.ready,
        driver_carta_porte_missing: driver.missing,
        truck_carta_porte_ready: truck.ready,
        truck_carta_porte_missing: truck.missing,
    });
    if ('carta_porte_xml' in view) {
        delete view.carta_porte_xml;
    }
    return view;
}
function splitWeightKg(totalKg, quantities) {
    const sum = quantities.reduce((acc, qty) => acc + (qty > 0 ? qty : 0), 0);
    const base = sum > 0 ? quantities : quantities.map(() => 1);
    const divisor = base.reduce((acc, qty) => acc + qty, 0) || 1;
    const rounded = base.map((qty) => Math.round(((totalKg * qty) / divisor) * 1000) / 1000);
    const drift = Math.round((totalKg - rounded.reduce((acc, qty) => acc + qty, 0)) * 1000) / 1000;
    if (rounded.length) {
        rounded[rounded.length - 1] = Math.round((rounded[rounded.length - 1] + drift) * 1000) / 1000;
    }
    return rounded.map((value) => (value > 0 ? value : 0.001));
}
//# sourceMappingURL=carta-porte.util.js.map