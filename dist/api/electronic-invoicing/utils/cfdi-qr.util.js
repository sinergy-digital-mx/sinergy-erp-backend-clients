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
exports.formatCfdiQrTotal = formatCfdiQrTotal;
exports.buildCfdiVerificationUrl = buildCfdiVerificationUrl;
exports.generateCfdiQrDataUrl = generateCfdiQrDataUrl;
const QRCode = __importStar(require("qrcode"));
function formatCfdiQrTotal(total) {
    const normalized = Number(total).toFixed(2);
    return normalized.replace('.', '').padStart(17, '0');
}
function buildCfdiVerificationUrl(cfdi) {
    const selloForQr = cfdi.timbre.selloCFD || cfdi.sello;
    const fe = selloForQr.slice(-8);
    const params = new URLSearchParams({
        id: cfdi.timbre.uuid,
        re: cfdi.emisor.rfc,
        rr: cfdi.receptor.rfc,
        tt: formatCfdiQrTotal(cfdi.total),
        fe,
    });
    return `https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx?&${params.toString()}`;
}
async function generateCfdiQrDataUrl(verificationUrl) {
    return QRCode.toDataURL(verificationUrl, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 220,
    });
}
//# sourceMappingURL=cfdi-qr.util.js.map