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
exports.buildStyledExcelBuffer = buildStyledExcelBuffer;
exports.formatExportDate = formatExportDate;
exports.formatExportDateTime = formatExportDateTime;
exports.num = num;
exports.buildExportSubtitle = buildExportSubtitle;
exports.validateDateRange = validateDateRange;
const ExcelJS = __importStar(require("exceljs"));
const DEFAULT_HEADER_COLOR = 'FF4B5A8A';
const DEFAULT_TITLE_COLOR = 'FF2C3E6B';
async function buildStyledExcelBuffer(options) {
    const { sheetName, title, subtitle, columns, rows, headerColor = DEFAULT_HEADER_COLOR, titleColor = DEFAULT_TITLE_COLOR, } = options;
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sinergy ERP';
    workbook.created = new Date();
    const worksheet = workbook.addWorksheet(sheetName, {
        views: [{ state: 'frozen', ySplit: subtitle ? 3 : 2 }],
    });
    const colCount = columns.length;
    const titleRow = worksheet.addRow([title]);
    worksheet.mergeCells(1, 1, 1, colCount);
    const titleCell = titleRow.getCell(1);
    titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: titleColor },
    };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleRow.height = 28;
    if (subtitle) {
        const subRow = worksheet.addRow([subtitle]);
        worksheet.mergeCells(2, 1, 2, colCount);
        const subCell = subRow.getCell(1);
        subCell.font = { italic: true, size: 10, color: { argb: 'FF555555' } };
        subCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFEEF2F7' },
        };
        subCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        subRow.height = 22;
    }
    const headerRow = worksheet.addRow(columns.map((c) => c.header));
    headerRow.height = 22;
    headerRow.eachCell((cell) => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: headerColor },
        };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = thinBorder('FF000000');
    });
    rows.forEach((rowData, index) => {
        const values = columns.map((col) => rowData[col.key] ?? '');
        const row = worksheet.addRow(values);
        const isEven = index % 2 === 0;
        row.eachCell((cell, colNumber) => {
            const colDef = columns[colNumber - 1];
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: isEven ? 'FFFFFFFF' : 'FFF5F8FC' },
            };
            cell.border = thinBorder('FFE0E0E0');
            if (colDef?.type === 'currency' && typeof cell.value === 'number') {
                cell.numFmt = '$#,##0.00';
                cell.alignment = { horizontal: 'right', vertical: 'middle' };
            }
            else if (colDef?.type === 'unit_cost' && typeof cell.value === 'number') {
                cell.numFmt = '$#,##0.00##';
                cell.alignment = { horizontal: 'right', vertical: 'middle' };
            }
            else if (colDef?.type === 'number' && typeof cell.value === 'number') {
                cell.numFmt = '#,##0.00';
                cell.alignment = { horizontal: 'right', vertical: 'middle' };
            }
            else if (colDef?.type === 'integer' && typeof cell.value === 'number') {
                cell.numFmt = '#,##0';
                cell.alignment = { horizontal: 'right', vertical: 'middle' };
            }
            else if (colDef?.type === 'percent' && typeof cell.value === 'number') {
                cell.numFmt = '0.00"%"';
                cell.alignment = { horizontal: 'right', vertical: 'middle' };
            }
            else if (colDef?.type === 'date') {
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
            }
            else {
                cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
            }
        });
    });
    worksheet.columns = columns.map((col) => ({ width: col.width ?? 16 }));
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
}
function thinBorder(color) {
    const side = { style: 'thin', color: { argb: color } };
    return { top: side, left: side, bottom: side, right: side };
}
function formatExportDate(value) {
    if (!value)
        return '';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime()))
        return '';
    return new Intl.DateTimeFormat('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(date);
}
function formatExportDateTime(value) {
    if (!value)
        return '';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime()))
        return '';
    return new Intl.DateTimeFormat('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).format(date);
}
function num(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
}
function buildExportSubtitle(parts) {
    return parts.filter(Boolean).join('  •  ');
}
function validateDateRange(from, to) {
    const start = new Date(from);
    const end = new Date(to);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        throw new Error('Rango de fechas inválido');
    }
    if (start > end) {
        throw new Error('created_from debe ser anterior o igual a created_to');
    }
}
//# sourceMappingURL=excel-export.util.js.map