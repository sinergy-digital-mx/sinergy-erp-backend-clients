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
    const loaded = (await import('pdfjs-dist/legacy/build/pdf.mjs'));
    const pdfjs = typeof loaded.getDocument === 'function' ? loaded : loaded.default;
    if (!pdfjs?.getDocument) {
        throw new sat_csf_util_1.SatCsfParseError('No se pudo abrir el PDF de la constancia del SAT.');
    }
    const packageDir = node_path_1.default.dirname(nodeRequire.resolve('pdfjs-dist/package.json'));
    const workerPath = nodeRequire.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs');
    if (pdfjs.GlobalWorkerOptions) {
        pdfjs.GlobalWorkerOptions.workerSrc = (0, node_url_1.pathToFileURL)(workerPath).href;
    }
    const openParams = {
        disableFontFace: true,
        isEvalSupported: false,
        verbosity: 0,
        standardFontDataUrl: directoryUrl(packageDir, 'standard_fonts'),
        cMapUrl: directoryUrl(packageDir, 'cmaps'),
        cMapPacked: true,
    };
    const data = Uint8Array.from(buffer);
    let document;
    try {
        document = await pdfjs.getDocument({ ...openParams, data }).promise;
    }
    catch (error) {
        if (isPasswordError(error)) {
            try {
                document = await pdfjs.getDocument({
                    ...openParams,
                    data: Uint8Array.from(buffer),
                    password: '',
                }).promise;
            }
            catch (retryError) {
                throw toOpenError(retryError);
            }
        }
        else {
            throw toOpenError(error);
        }
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
function isPasswordError(error) {
    return error instanceof Error && error.name === 'PasswordException';
}
function toOpenError(error) {
    const name = error instanceof Error ? error.name : '';
    const message = error instanceof Error ? error.message : String(error);
    console.error(`SAT constancia PDF: ${name} ${message}`);
    if (name === 'PasswordException') {
        return new sat_csf_util_1.SatCsfParseError('La constancia está protegida con contraseña. Descárgala de nuevo desde el SAT.');
    }
    return new sat_csf_util_1.SatCsfParseError('No se pudo abrir el PDF de la constancia del SAT.');
}
function directoryUrl(packageDir, folder) {
    const href = (0, node_url_1.pathToFileURL)(node_path_1.default.join(packageDir, folder)).href;
    return href.endsWith('/') ? href : `${href}/`;
}
//# sourceMappingURL=sat-csf-pdf.util.js.map