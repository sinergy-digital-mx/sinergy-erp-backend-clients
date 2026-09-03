"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EscPosBuilder = exports.ESCPOS_CHARS_PER_LINE = void 0;
exports.bufferToEscPosHex = bufferToEscPosHex;
exports.padLeft = padLeft;
exports.padRight = padRight;
exports.formatMoney = formatMoney;
exports.formatUnitMoney = formatUnitMoney;
exports.formatUsd = formatUsd;
exports.compactMoneyLine = compactMoneyLine;
exports.labelValueLine = labelValueLine;
exports.leftLabelLines = leftLabelLines;
exports.twoColumnLine = twoColumnLine;
exports.wrapLines = wrapLines;
exports.productLine = productLine;
const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;
exports.ESCPOS_CHARS_PER_LINE = 48;
function bufferToEscPosHex(buffer) {
    return buffer.toString('hex').toUpperCase();
}
class EscPosBuilder {
    chunks = [];
    initialize() {
        this.chunks.push(Buffer.from([ESC, 0x40]));
        return this.selectFontA().setCodePageLatin1().characterSizeNormal();
    }
    selectFontB() {
        this.chunks.push(Buffer.from([ESC, 0x4d, 0x01]));
        return this;
    }
    selectFontA() {
        this.chunks.push(Buffer.from([ESC, 0x4d, 0x00]));
        return this;
    }
    setCodePageLatin1() {
        this.chunks.push(Buffer.from([ESC, 0x74, 0x02]));
        return this;
    }
    characterSizeNormal() {
        this.chunks.push(Buffer.from([GS, 0x21, 0x00]));
        return this;
    }
    characterSizeDouble() {
        this.chunks.push(Buffer.from([GS, 0x21, 0x11]));
        return this;
    }
    raw(bytes) {
        this.chunks.push(Buffer.from(bytes));
        return this;
    }
    align(mode) {
        const n = mode === 'left' ? 0 : mode === 'center' ? 1 : 2;
        this.chunks.push(Buffer.from([ESC, 0x61, n]));
        return this;
    }
    bold(enabled = true) {
        this.chunks.push(Buffer.from([ESC, 0x45, enabled ? 1 : 0]));
        return this;
    }
    textLine(line = '') {
        this.chunks.push(Buffer.from(this.sanitize(line), 'latin1'));
        this.chunks.push(Buffer.from([LF]));
        return this;
    }
    blankLines(count = 1) {
        for (let i = 0; i < count; i++) {
            this.textLine('');
        }
        return this;
    }
    separator(char = '-') {
        return this.textLine(char.repeat(exports.ESCPOS_CHARS_PER_LINE));
    }
    qr(data, moduleSize = 5) {
        const payload = Buffer.from(data, 'utf8');
        const size = Math.min(16, Math.max(3, moduleSize));
        this.chunks.push(Buffer.from([GS, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00]));
        this.chunks.push(Buffer.from([GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, size]));
        this.chunks.push(Buffer.from([GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x31]));
        const storeLen = payload.length + 3;
        this.chunks.push(Buffer.from([GS, 0x28, 0x6b, storeLen & 0xff, (storeLen >> 8) & 0xff, 0x31, 0x50, 0x30]));
        this.chunks.push(payload);
        this.chunks.push(Buffer.from([GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30]));
        return this;
    }
    cut(partial = true) {
        this.blankLines(4);
        this.chunks.push(Buffer.from([GS, 0x56, partial ? 1 : 0]));
        return this;
    }
    build() {
        return Buffer.concat(this.chunks);
    }
    sanitize(value) {
        return value
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\x20-\x7E]/g, ' ');
    }
}
exports.EscPosBuilder = EscPosBuilder;
function padLeft(value, width) {
    if (value.length >= width)
        return value.slice(0, width);
    return ' '.repeat(width - value.length) + value;
}
function padRight(value, width) {
    if (value.length >= width)
        return value.slice(0, width);
    return value + ' '.repeat(width - value.length);
}
function formatMoney(amount) {
    return '$' + amount.toFixed(2);
}
function formatUnitMoney(amount) {
    const n = Number(amount) || 0;
    const [integer, fraction = ''] = n.toFixed(4).split('.');
    const decimals = fraction.replace(/0+$/, '').padEnd(2, '0');
    return '$' + integer + '.' + decimals;
}
function formatUsd(amount) {
    return 'USD ' + amount.toFixed(2);
}
function compactMoneyLine(label, formattedValue, width = exports.ESCPOS_CHARS_PER_LINE) {
    const text = `${label} ${formattedValue}`;
    if (text.length <= width)
        return text;
    const trimmedLabel = label.slice(0, Math.max(1, width - formattedValue.length - 1));
    return `${trimmedLabel} ${formattedValue}`;
}
function labelValueLine(label, value, width = exports.ESCPOS_CHARS_PER_LINE) {
    const maxLabel = width - value.length - 1;
    const safeLabel = label.length > maxLabel ? label.slice(0, maxLabel) : label;
    const spaces = Math.max(1, width - safeLabel.length - value.length);
    return safeLabel + ' '.repeat(spaces) + value;
}
function leftLabelLines(label, value, width = exports.ESCPOS_CHARS_PER_LINE) {
    return wrapLines(`${label} ${value}`.trim(), width);
}
function twoColumnLine(left, right, width = exports.ESCPOS_CHARS_PER_LINE) {
    const half = Math.floor(width / 2);
    const safeLeft = left.length > half ? left.slice(0, half) : left;
    const safeRight = right.length > half ? right.slice(0, half) : right;
    return padRight(safeLeft, half) + padRight(safeRight, width - half);
}
function wrapLines(text, width = exports.ESCPOS_CHARS_PER_LINE) {
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length === 0)
        return [''];
    const lines = [];
    let current = '';
    for (const word of words) {
        const candidate = current ? `${current} ${word}` : word;
        if (candidate.length <= width) {
            current = candidate;
            continue;
        }
        if (current)
            lines.push(current);
        current = word.length > width ? word.slice(0, width) : word;
    }
    if (current)
        lines.push(current);
    return lines;
}
function productLine(description, quantity, unitPrice, lineTotal, width = exports.ESCPOS_CHARS_PER_LINE) {
    const qtyW = 7;
    const priceW = 9;
    const totalW = 10;
    const descW = width - qtyW - priceW - totalW;
    return (padRight(description, descW) +
        padLeft(quantity, qtyW) +
        padLeft(unitPrice, priceW) +
        padLeft(lineTotal, totalW));
}
//# sourceMappingURL=escpos.util.js.map