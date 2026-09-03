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
exports.parseMadereriaInventoryExcel = parseMadereriaInventoryExcel;
const XLSX = __importStar(require("xlsx"));
const HEADER_ALIASES = {
    CODIGO: 'sku',
    DESCRIPCION: 'name',
    DESCRIPCIÓN: 'name',
    ALTERNO: 'alternate_sku',
    PRECIO1: 'price',
    PRECIO: 'price',
    'COSTO PROM': 'cost',
    'COSTO PROMEDIO': 'cost',
    COSTOPROM: 'cost',
    CANTIDAD: 'quantity',
};
function normalizeHeader(value) {
    return String(value ?? '')
        .trim()
        .replace(/\s+/g, ' ')
        .toUpperCase();
}
function parseNumber(value) {
    if (value === null || value === undefined || value === '') {
        return null;
    }
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : null;
    }
    const cleaned = String(value)
        .trim()
        .replace(/[$\s]/g, '')
        .replace(/,/g, '');
    if (!cleaned) {
        return null;
    }
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
}
function cleanText(value) {
    if (value === null || value === undefined) {
        return null;
    }
    const text = String(value).trim();
    return text || null;
}
function isFooterOrJunkRow(sku, name) {
    const s = sku.toUpperCase();
    const n = name.toUpperCase();
    const blob = `${s} ${n}`;
    if (/CANT\.?\s*ART/.test(blob))
        return true;
    if (/TOTAL\s+POR\s+CANTIDAD/.test(blob))
        return true;
    if (/^TOTAL\b/.test(s) || /^TOTAL\b/.test(n))
        return true;
    if (/PRECIOS\s+Y\s+COSTOS/.test(blob))
        return true;
    if (/^P[AÁ]GINA\b/.test(s))
        return true;
    if (/^MONEDA\b/.test(s))
        return true;
    return false;
}
function parseMadereriaInventoryExcel(buffer) {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
        throw new Error('El archivo no tiene hojas');
    }
    const sheet = workbook.Sheets[sheetName];
    const raw = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: null,
        raw: true,
    });
    let headerIndex = -1;
    const columnIndex = {};
    for (let i = 0; i < Math.min(raw.length, 30); i++) {
        const row = raw[i] ?? [];
        const mapped = {};
        row.forEach((cell, col) => {
            const alias = HEADER_ALIASES[normalizeHeader(cell)];
            if (alias) {
                mapped[alias] = col;
            }
        });
        if (mapped.sku !== undefined && mapped.quantity !== undefined) {
            headerIndex = i;
            Object.assign(columnIndex, mapped);
            break;
        }
    }
    if (headerIndex < 0) {
        throw new Error('No se encontró la fila de encabezados. Se espera CODIGO, DESCRIPCION, PRECIO1, COSTO PROM y CANTIDAD.');
    }
    const rows = [];
    for (let i = headerIndex + 1; i < raw.length; i++) {
        const row = raw[i] ?? [];
        const sku = cleanText(row[columnIndex.sku ?? 0]);
        if (!sku) {
            continue;
        }
        const name = cleanText(row[columnIndex.name ?? 1]) ?? sku;
        if (isFooterOrJunkRow(sku, name)) {
            break;
        }
        const alternateRaw = columnIndex.alternate_sku !== undefined
            ? cleanText(row[columnIndex.alternate_sku])
            : null;
        const alternate_sku = alternateRaw && alternateRaw.toUpperCase() !== sku.toUpperCase()
            ? alternateRaw
            : null;
        rows.push({
            row_number: i + 1,
            sku,
            name: name.slice(0, 255),
            alternate_sku,
            price: columnIndex.price !== undefined ? parseNumber(row[columnIndex.price]) : null,
            cost: columnIndex.cost !== undefined ? parseNumber(row[columnIndex.cost]) : null,
            quantity: columnIndex.quantity !== undefined ? parseNumber(row[columnIndex.quantity]) : null,
        });
    }
    if (!rows.length) {
        throw new Error('El archivo no tiene renglones de productos');
    }
    return rows;
}
//# sourceMappingURL=excel-inventory.parser.js.map