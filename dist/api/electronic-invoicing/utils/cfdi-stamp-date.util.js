"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCfdiDate = parseCfdiDate;
exports.stampDateFromXml = stampDateFromXml;
exports.extractStampDate = extractStampDate;
const zlib_1 = require("zlib");
function parseCfdiDate(value) {
    const raw = (value ?? '').trim();
    if (!raw)
        return null;
    const date = new Date(raw.includes('T') ? raw : raw.replace(' ', 'T'));
    return Number.isNaN(date.getTime()) ? null : date;
}
function stampDateFromXml(xml) {
    const timbre = /FechaTimbrado="([^"]+)"/i.exec(xml ?? '');
    return parseCfdiDate(timbre?.[1]);
}
function extractStampDate(buffer) {
    const raw = buffer.toString('latin1');
    const direct = stampDateFromText(raw);
    if (direct)
        return direct;
    const inflated = stampDateFromText(inflatePdfStreams(buffer));
    if (inflated)
        return inflated;
    return pdfCreationDate(raw);
}
function pdfCreationDate(text) {
    const match = /\/CreationDate\s*\(D:(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(Z|[+-]\d{2}'\d{2}')?\)/.exec(text);
    if (!match)
        return null;
    const [, year, month, day, hour, minute, second, zone] = match;
    const iso = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
    if (!zone || zone === 'Z')
        return parseCfdiDate(`${iso}Z`);
    const offset = zone.replace("'", ':').replace("'", '');
    return parseCfdiDate(`${iso}${offset}`);
}
function stampDateFromText(text) {
    const timbre = /FechaTimbrado="([^"]+)"/i.exec(text);
    const fromTimbre = parseCfdiDate(timbre?.[1]);
    if (fromTimbre)
        return fromTimbre;
    const certification = /certificaci[oó]n[^0-9]{0,40}(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/i.exec(text);
    const fromLabel = parseCfdiDate(certification?.[1]);
    if (fromLabel)
        return fromLabel;
    const dates = [...text.matchAll(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/g)].map((match) => match[0]);
    return parseCfdiDate(dates.at(-1));
}
function inflatePdfStreams(buffer) {
    const raw = buffer.toString('latin1');
    const parts = [];
    const marker = /stream\r?\n/g;
    let match;
    while ((match = marker.exec(raw))) {
        const start = match.index + match[0].length;
        const end = raw.indexOf('endstream', start);
        if (end < 0)
            break;
        const slice = buffer.subarray(Buffer.byteLength(raw.slice(0, start), 'latin1'), Buffer.byteLength(raw.slice(0, end), 'latin1'));
        const inflated = tryInflate(slice);
        if (inflated)
            parts.push(inflated);
    }
    return parts.join('\n');
}
function tryInflate(slice) {
    const trimmed = slice.subarray(0, Math.max(0, slice.length - 1));
    for (const candidate of [slice, trimmed]) {
        try {
            return (0, zlib_1.inflateSync)(candidate).toString('latin1');
        }
        catch {
            try {
                return (0, zlib_1.inflateRawSync)(candidate).toString('latin1');
            }
            catch {
                continue;
            }
        }
    }
    return null;
}
//# sourceMappingURL=cfdi-stamp-date.util.js.map