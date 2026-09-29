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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROPERTY_IMPORT_HEADERS = exports.PROPERTY_IMPORT_EXAMPLE_CODE = exports.PROPERTY_IMPORT_MAX_ROWS = exports.PROPERTY_IMPORT_SHEET = void 0;
exports.foldText = foldText;
exports.buildPropertyImportTemplate = buildPropertyImportTemplate;
exports.parsePropertyImportWorkbook = parsePropertyImportWorkbook;
exports.resolvePropertyImportRows = resolvePropertyImportRows;
const ExcelJS = __importStar(require("exceljs"));
const XLSX = __importStar(require("xlsx"));
const property_pricing_util_1 = require("./property-pricing.util");
exports.PROPERTY_IMPORT_SHEET = 'Lotes';
exports.PROPERTY_IMPORT_MAX_ROWS = 500;
exports.PROPERTY_IMPORT_EXAMPLE_CODE = 'EJEMPLO';
exports.PROPERTY_IMPORT_HEADERS = [
    'codigo',
    'nombre',
    'grupo',
    'area',
    'unidad',
    'manzana',
    'numero_lote',
    'clave_catastral',
    'ubicacion',
    'descripcion',
    'precio_m2',
    'precio_total',
    'moneda',
    'estado',
];
const HEADER_ALIASES = {
    codigo: 'code',
    nombre: 'name',
    grupo: 'group',
    area: 'area',
    unidad: 'unit',
    manzana: 'block',
    numero_lote: 'lot_number',
    numero_de_lote: 'lot_number',
    clave_catastral: 'cadastral_key',
    ubicacion: 'location',
    descripcion: 'description',
    precio_m2: 'price_per_m2',
    precio_por_m2: 'price_per_m2',
    precio_total: 'total_price',
    moneda: 'currency',
    estado: 'status',
};
const STATUSES = new Set(['disponible', 'vendido', 'reservado', 'cancelado']);
function foldText(value) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase()
        .replace(/²/g, '2')
        .replace(/\s+/g, ' ');
}
function headerKey(value) {
    return foldText(String(value ?? '')).replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}
function cellText(value) {
    if (value == null) {
        return '';
    }
    return String(value).trim();
}
function parseNumber(value) {
    if (value == null || value === '') {
        return null;
    }
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : 'invalid';
    }
    const text = String(value).trim().replace(/,/g, '');
    if (!text) {
        return null;
    }
    const parsed = Number(text);
    return Number.isFinite(parsed) ? parsed : 'invalid';
}
async function buildPropertyImportTemplate(catalogs) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(exports.PROPERTY_IMPORT_SHEET);
    sheet.addRow([...exports.PROPERTY_IMPORT_HEADERS]);
    sheet.addRow([
        exports.PROPERTY_IMPORT_EXAMPLE_CODE,
        'Lote ejemplo',
        catalogs.groups[0]?.name ?? 'Nombre del grupo',
        250,
        catalogs.units[0]?.symbol ?? 'm²',
        'A',
        '1',
        '',
        '',
        '',
        120,
        '',
        'USD',
        'disponible',
    ]);
    sheet.getRow(1).font = { bold: true };
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    sheet.columns.forEach((column) => {
        column.width = 18;
    });
    const groupsSheet = workbook.addWorksheet('Grupos');
    groupsSheet.addRow(['nombre']);
    groupsSheet.getRow(1).font = { bold: true };
    for (const group of catalogs.groups) {
        groupsSheet.addRow([group.name]);
    }
    groupsSheet.getColumn(1).width = 32;
    const unitsSheet = workbook.addWorksheet('Unidades');
    unitsSheet.addRow(['simbolo', 'nombre', 'codigo']);
    unitsSheet.getRow(1).font = { bold: true };
    for (const unit of catalogs.units) {
        unitsSheet.addRow([unit.symbol, unit.name, unit.code]);
    }
    unitsSheet.columns.forEach((column) => {
        column.width = 22;
    });
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
}
function parsePropertyImportWorkbook(buffer) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames.find((name) => foldText(name) === foldText(exports.PROPERTY_IMPORT_SHEET)) ??
        workbook.SheetNames[0];
    if (!sheetName) {
        return { rows: [], errors: [{ row: 1, message: 'El archivo no tiene hojas.' }] };
    }
    const matrix = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
        header: 1,
        raw: true,
        defval: '',
    });
    if (!matrix.length) {
        return { rows: [], errors: [{ row: 1, message: 'La hoja de lotes está vacía.' }] };
    }
    const headers = (matrix[0] ?? []).map((cell) => HEADER_ALIASES[headerKey(cell)]).filter(Boolean);
    const required = ['code', 'name', 'group', 'area', 'unit'];
    const missing = required.filter((key) => !headers.includes(key));
    if (missing.length) {
        return {
            rows: [],
            errors: [
                {
                    row: 1,
                    message: 'La primera fila debe ser la plantilla (codigo, nombre, grupo, area, unidad). Descárgala de nuevo.',
                },
            ],
        };
    }
    const columnIndex = new Map();
    (matrix[0] ?? []).forEach((cell, index) => {
        const key = HEADER_ALIASES[headerKey(cell)];
        if (key && !columnIndex.has(key)) {
            columnIndex.set(key, index);
        }
    });
    const rows = [];
    const errors = [];
    for (let index = 1; index < matrix.length; index += 1) {
        const line = matrix[index] ?? [];
        const values = {};
        for (const [key, column] of columnIndex) {
            values[key] = line[column];
        }
        const code = cellText(values.code);
        const hasContent = Object.values(values).some((value) => cellText(value) !== '');
        if (!hasContent || foldText(code) === foldText(exports.PROPERTY_IMPORT_EXAMPLE_CODE)) {
            continue;
        }
        if (rows.length >= exports.PROPERTY_IMPORT_MAX_ROWS) {
            errors.push({
                row: index + 1,
                message: `El archivo supera ${exports.PROPERTY_IMPORT_MAX_ROWS} lotes. Divídelo e impórtalo por partes.`,
            });
            break;
        }
        rows.push({ row: index + 1, values });
    }
    return { rows, errors };
}
function resolvePropertyImportRows(rows, catalogs, parseErrors = []) {
    const errors = [...parseErrors];
    const ready = [];
    const seenCodes = new Set();
    const groups = new Map(catalogs.groups.map((group) => [foldText(group.name), group.id]));
    const units = new Map();
    for (const unit of catalogs.units) {
        for (const label of [unit.symbol, unit.code, unit.name]) {
            const key = foldText(label);
            if (key && !units.has(key)) {
                units.set(key, unit.id);
            }
        }
    }
    for (const row of rows) {
        const rowErrors = validateRow(row, groups, units, catalogs.existingCodes, seenCodes);
        if (rowErrors.length) {
            errors.push(...rowErrors);
            continue;
        }
        ready.push(toDto(row, groups, units));
    }
    errors.sort((left, right) => left.row - right.row || left.message.localeCompare(right.message));
    return { ready: errors.length ? [] : ready, errors };
}
function validateRow(row, groups, units, existingCodes, seenCodes) {
    const errors = [];
    const fail = (message) => errors.push({ row: row.row, message });
    const code = cellText(row.values.code);
    const name = cellText(row.values.name);
    const groupName = cellText(row.values.group);
    const unitLabel = cellText(row.values.unit);
    const area = parseNumber(row.values.area);
    const pricePerM2 = parseNumber(row.values.price_per_m2);
    const totalPrice = parseNumber(row.values.total_price);
    const currency = cellText(row.values.currency).toUpperCase();
    const status = foldText(cellText(row.values.status));
    const block = cellText(row.values.block);
    const lotNumber = cellText(row.values.lot_number);
    const cadastralKey = cellText(row.values.cadastral_key);
    const location = cellText(row.values.location);
    if (!code)
        fail('El código es obligatorio.');
    else if (code.length > 50)
        fail('El código admite máximo 50 caracteres.');
    else {
        const folded = foldText(code);
        if (seenCodes.has(folded))
            fail(`El código "${code}" está repetido en el archivo.`);
        else if (existingCodes.has(folded))
            fail(`Ya existe un lote con el código "${code}".`);
        else
            seenCodes.add(folded);
    }
    if (!name)
        fail('El nombre es obligatorio.');
    else if (name.length > 150)
        fail('El nombre admite máximo 150 caracteres.');
    if (!groupName)
        fail('El grupo es obligatorio.');
    else if (!groups.has(foldText(groupName))) {
        fail(`No existe el grupo "${groupName}". Usa un nombre de la hoja Grupos.`);
    }
    if (area === 'invalid')
        fail('El área no es un número.');
    else if (area == null || area <= 0)
        fail('El área debe ser mayor a 0.');
    if (!unitLabel)
        fail('La unidad es obligatoria.');
    else if (!units.has(foldText(unitLabel))) {
        fail(`No existe la unidad "${unitLabel}". Usa un símbolo de la hoja Unidades.`);
    }
    if (block.length > 50)
        fail('La manzana admite máximo 50 caracteres.');
    if (lotNumber.length > 50)
        fail('El número de lote admite máximo 50 caracteres.');
    if (cadastralKey.length > 100)
        fail('La clave catastral admite máximo 100 caracteres.');
    if (location.length > 255)
        fail('La ubicación admite máximo 255 caracteres.');
    if (pricePerM2 === 'invalid')
        fail('El precio por m² no es un número.');
    if (totalPrice === 'invalid')
        fail('El precio total no es un número.');
    if (pricePerM2 !== 'invalid' && totalPrice !== 'invalid' && area !== 'invalid') {
        try {
            (0, property_pricing_util_1.resolvePropertyPricing)({
                totalArea: area,
                totalPrice: totalPrice,
                pricePerM2: pricePerM2,
                isCreate: true,
            });
        }
        catch (error) {
            if (error instanceof property_pricing_util_1.PropertyPricingError) {
                fail(error.message);
            }
            else {
                throw error;
            }
        }
    }
    if (currency && currency !== 'USD' && currency !== 'MXN') {
        fail('La moneda debe ser USD o MXN.');
    }
    if (status && !STATUSES.has(status)) {
        fail('El estado debe ser disponible, vendido, reservado o cancelado.');
    }
    return errors;
}
function toDto(row, groups, units) {
    const area = parseNumber(row.values.area);
    const pricePerM2 = parseNumber(row.values.price_per_m2);
    const totalPrice = parseNumber(row.values.total_price);
    const currency = cellText(row.values.currency).toUpperCase();
    const status = foldText(cellText(row.values.status));
    const dto = {
        code: cellText(row.values.code),
        name: cellText(row.values.name),
        group_id: groups.get(foldText(cellText(row.values.group))),
        total_area: area,
        measurement_unit_id: units.get(foldText(cellText(row.values.unit))),
    };
    const block = cellText(row.values.block);
    const lotNumber = cellText(row.values.lot_number);
    const cadastralKey = cellText(row.values.cadastral_key);
    const location = cellText(row.values.location);
    const description = cellText(row.values.description);
    if (block)
        dto.block = block;
    if (lotNumber)
        dto.lot_number = lotNumber;
    if (cadastralKey)
        dto.cadastral_key = cadastralKey;
    if (location)
        dto.location = location;
    if (description)
        dto.description = description;
    if (typeof pricePerM2 === 'number')
        dto.price_per_m2 = pricePerM2;
    else if (typeof totalPrice === 'number')
        dto.total_price = totalPrice;
    if (currency === 'USD' || currency === 'MXN')
        dto.currency = currency;
    if (STATUSES.has(status))
        dto.status = status;
    return dto;
}
//# sourceMappingURL=property-import.util.js.map