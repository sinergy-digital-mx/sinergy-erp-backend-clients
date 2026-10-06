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
exports.normalizeSatClave = normalizeSatClave;
exports.parsePedimentoCell = parsePedimentoCell;
exports.selectPrimaryPedimento = selectPrimaryPedimento;
exports.parseMadereriaInventoryExcel = parseMadereriaInventoryExcel;
const XLSX = __importStar(require("xlsx"));
const HEADER_ALIASES = {
    CODIGO: 'sku',
    DESCRIPCION: 'name',
    DESCRIPCIÓN: 'name',
    ALTERNO: 'alternate_sku',
    'CLAVE SAT': 'sat_clave',
    CLAVESAT: 'sat_clave',
    CLAVE_SAT: 'sat_clave',
    'PEDIMENTO/FECHA/ADUANA/PROVEEDOR': 'pedimentos',
    PEDIMENTO: 'pedimentos',
    PRECIO1: 'price',
    PRECIO: 'price',
    'COSTO PROM': 'cost',
    'COSTO PROMEDIO': 'cost',
    COSTOPROM: 'cost',
    CANTIDAD: 'quantity',
};
const FULL_PEDIMENTO = /^(\d{2})\s+(\d{2})\s+(\d{4})\s+(\d{7})\s*-\s*(\d{4})\/(\d{2})\/(\d{2})\s*-\s*(.*)$/;
const PARTIAL_PEDIMENTO = /^(\d{4})-(\d{7})\s*-\s*(\d{4})\/(\d{2})\/(\d{2})\s*-\s*(.*)$/;
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
function cleanSku(value) {
    if (typeof value === 'number') {
        if (!Number.isFinite(value)) {
            return null;
        }
        if (Number.isInteger(value)) {
            return String(value);
        }
    }
    return cleanText(value);
}
function normalizeSatClave(value) {
    const digits = typeof value === 'number' && Number.isFinite(value)
        ? String(Math.trunc(Math.abs(value)))
        : String(value ?? '').replace(/\D/g, '');
    if (!digits) {
        return null;
    }
    return digits.padStart(8, '0').slice(-8);
}
function isoDate(year, month, day) {
    const y = Number(year);
    const m = Number(month);
    const d = Number(day);
    if (!y || m < 1 || m > 12 || d < 1 || d > 31) {
        return null;
    }
    return `${year}-${month}-${day}`;
}
function splitCustomsVendor(value) {
    let text = value.trim();
    if (!text) {
        return { customs: null, vendor: null };
    }
    let customs = null;
    if (text.startsWith('-')) {
        text = text.replace(/^-+/, '').trim();
    }
    else {
        const dash = text.indexOf('-');
        if (dash > 0) {
            customs = text.slice(0, dash).trim() || null;
            text = text.slice(dash + 1).trim();
        }
    }
    if (!text || text === '0') {
        return { customs, vendor: null };
    }
    return { customs, vendor: text.slice(0, 255) };
}
function parsePedimentoLine(line) {
    const raw = line.trim();
    if (!raw) {
        return null;
    }
    const full = raw.match(FULL_PEDIMENTO);
    if (full) {
        const customsVendor = splitCustomsVendor(full[8] ?? '');
        return {
            number: `${full[1]}  ${full[2]}  ${full[3]}  ${full[4]}`.slice(0, 30),
            date: isoDate(full[5], full[6], full[7]),
            customs: customsVendor.customs,
            vendor: customsVendor.vendor,
            raw: raw.slice(0, 500),
        };
    }
    const partial = raw.match(PARTIAL_PEDIMENTO);
    if (partial) {
        const customsVendor = splitCustomsVendor(partial[6] ?? '');
        return {
            number: `${partial[1]}-${partial[2]}`.slice(0, 30),
            date: isoDate(partial[3], partial[4], partial[5]),
            customs: customsVendor.customs,
            vendor: customsVendor.vendor,
            raw: raw.slice(0, 500),
        };
    }
    return {
        number: null,
        date: null,
        customs: null,
        vendor: null,
        raw: raw.slice(0, 500),
    };
}
function parsePedimentoCell(value) {
    if (value === null || value === undefined || value === '') {
        return [];
    }
    return String(value)
        .split(/\r?\n/)
        .map((line) => parsePedimentoLine(line))
        .filter((entry) => entry !== null);
}
function selectPrimaryPedimento(entries) {
    const withNumber = entries.filter((entry) => entry.number);
    if (!withNumber.length) {
        return null;
    }
    let best = withNumber[0];
    for (const entry of withNumber.slice(1)) {
        if ((entry.date ?? '') > (best.date ?? '')) {
            best = entry;
        }
    }
    return best;
}
function isFooterRow(sku) {
    const s = sku.toUpperCase().replace(/\s+/g, ' ');
    if (/^CANT\.?\s*ART/.test(s))
        return true;
    if (/^TOTAL\b/.test(s))
        return true;
    if (/^PRECIOS\s+Y\s+COSTOS/.test(s))
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
    for (let i = 0; i < Math.min(raw.length, 40); i++) {
        const row = raw[i] ?? [];
        const mapped = {};
        row.forEach((cell, col) => {
            const alias = HEADER_ALIASES[normalizeHeader(cell)];
            if (alias && mapped[alias] === undefined) {
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
        throw new Error('No se encontró la fila de encabezados. Se espera CODIGO, DESCRIPCION, CLAVE SAT, PRECIO1, COSTO PROM y CANTIDAD.');
    }
    const rows = [];
    for (let i = headerIndex + 1; i < raw.length; i++) {
        const row = raw[i] ?? [];
        const sku = cleanSku(row[columnIndex.sku ?? 0]);
        if (!sku) {
            continue;
        }
        if (isFooterRow(sku)) {
            break;
        }
        const name = cleanText(row[columnIndex.name ?? 1]) ?? sku;
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
            sat_clave: columnIndex.sat_clave !== undefined
                ? normalizeSatClave(row[columnIndex.sat_clave])
                : null,
            pedimentos: columnIndex.pedimentos !== undefined
                ? parsePedimentoCell(row[columnIndex.pedimentos])
                : [],
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