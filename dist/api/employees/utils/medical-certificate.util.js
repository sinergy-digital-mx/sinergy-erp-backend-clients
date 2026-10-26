"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MEDICAL_CERTIFICATE_MAX_FILES = exports.MEDICAL_CERTIFICATE_MAX_BYTES = void 0;
exports.assertMedicalCertificateFile = assertMedicalCertificateFile;
exports.sanitizeUploadFileName = sanitizeUploadFileName;
exports.MEDICAL_CERTIFICATE_MAX_BYTES = 10 * 1024 * 1024;
exports.MEDICAL_CERTIFICATE_MAX_FILES = 8;
const ALLOWED_MIME = new Set([
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
]);
const ALLOWED_EXT = /\.(pdf|jpe?g|png|webp|heic|heif)$/i;
function assertMedicalCertificateFile(file) {
    if (!file?.buffer?.length) {
        throw new Error('No se recibió ningún archivo');
    }
    const size = Number(file.size ?? file.buffer.length);
    if (size > exports.MEDICAL_CERTIFICATE_MAX_BYTES) {
        throw new Error('El comprobante no puede superar 10 MB');
    }
    const mime = (file.mimetype || '').toLowerCase().split(';')[0].trim();
    const name = file.originalname || '';
    const mimeOk = ALLOWED_MIME.has(mime);
    const extOk = ALLOWED_EXT.test(name);
    if (!mimeOk && !extOk) {
        throw new Error('Sube un PDF o una imagen (JPG, PNG o WEBP)');
    }
}
function sanitizeUploadFileName(name) {
    const base = (name || 'comprobante').split(/[/\\]/).pop() || 'comprobante';
    const cleaned = base.replace(/[^\w.\- ()áéíóúüñÁÉÍÓÚÜÑ]+/g, '_').replace(/_+/g, '_');
    const trimmed = cleaned.replace(/^[_\s.]+|[_\s.]+$/g, '').slice(0, 180);
    return trimmed || 'comprobante';
}
//# sourceMappingURL=medical-certificate.util.js.map