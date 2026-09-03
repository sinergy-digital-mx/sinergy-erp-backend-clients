"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeEmail = normalizeEmail;
exports.emailsMatch = emailsMatch;
exports.normalizePhoneDigits = normalizePhoneDigits;
exports.phonesMatch = phonesMatch;
exports.composePhoneDigits = composePhoneDigits;
exports.isUsableEmail = isUsableEmail;
function normalizeEmail(value) {
    return String(value ?? '').trim().toLowerCase();
}
function emailsMatch(left, right) {
    const a = normalizeEmail(left);
    const b = normalizeEmail(right);
    return Boolean(a && b && a === b);
}
function normalizePhoneDigits(value) {
    const digits = String(value ?? '').replace(/\D/g, '');
    if (digits.length >= 10) {
        return digits.slice(-10);
    }
    return digits;
}
function phonesMatch(left, right) {
    const a = normalizePhoneDigits(left);
    const b = normalizePhoneDigits(right);
    return Boolean(a && b && a.length >= 8 && a === b);
}
function composePhoneDigits(phone, phoneCode) {
    return normalizePhoneDigits(`${phoneCode ?? ''}${phone ?? ''}`);
}
function isUsableEmail(value) {
    const email = normalizeEmail(value);
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
//# sourceMappingURL=self-invoice-contact.util.js.map