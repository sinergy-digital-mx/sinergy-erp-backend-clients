"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractSatCsfTextItems = extractSatCsfTextItems;
const node_module_1 = require("node:module");
const node_path_1 = __importDefault(require("node:path"));
const node_url_1 = require("node:url");
const sat_csf_util_1 = require("./sat-csf.util");
const nodeRequire = (0, node_module_1.createRequire)(__filename);
async function extractSatCsfTextItems(buffer) {
    if (!buffer?.length || buffer.subarray(0, 5).toString('utf8') !== '%PDF-') {
        throw new sat_csf_util_1.SatCsfParseError('Sube el PDF de la constancia del SAT.');
    }
    const pdfjs = (await import('pdfjs-dist/legacy/build/pdf.mjs'));
    const packageDir = node_path_1.default.dirname(nodeRequire.resolve('pdfjs-dist/package.json'));
    let document;
    try {
        document = await pdfjs.getDocument({
            data: new Uint8Array(buffer),
            disableWorker: true,
            disableFontFace: true,
            isEvalSupported: false,
            verbosity: 0,
            standardFontDataUrl: directoryUrl(packageDir, 'standard_fonts'),
            cMapUrl: directoryUrl(packageDir, 'cmaps'),
            cMapPacked: true,
        }).promise;
    }
    catch {
        throw new sat_csf_util_1.SatCsfParseError('No se pudo abrir el PDF de la constancia del SAT.');
    }
    const items = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
        const page = await document.getPage(pageNumber);
        const content = await page.getTextContent();
        for (const item of content.items) {
            const str = item.str?.trim();
            const transform = item.transform;
            if (!str || !transform) {
                continue;
            }
            items.push({
                str,
                x: transform[4] ?? 0,
                y: transform[5] ?? 0,
                page: pageNumber,
            });
        }
    }
    if (items.length === 0) {
        throw new sat_csf_util_1.SatCsfParseError('El PDF no tiene texto. Descarga la constancia desde el SAT; una foto o un escaneo no se puede leer.');
    }
    return items;
}
function directoryUrl(packageDir, folder) {
    const href = (0, node_url_1.pathToFileURL)(node_path_1.default.join(packageDir, folder)).href;
    return href.endsWith('/') ? href : `${href}/`;
}
//# sourceMappingURL=sat-csf-pdf.util.js.map