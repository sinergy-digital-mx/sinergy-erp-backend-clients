"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CREDIT_NOTE_RELATION_TYPE = void 0;
exports.roundCreditMoney = roundCreditMoney;
exports.splitCreditNoteEffect = splitCreditNoteEffect;
exports.creditNoteIncrement = creditNoteIncrement;
exports.isInvoiceVigente = isInvoiceVigente;
exports.isCommercialCreditNote = isCommercialCreditNote;
exports.isCreditableIncomeInvoice = isCreditableIncomeInvoice;
exports.isEgressDocument = isEgressDocument;
exports.sumVigenteCommercialCreditNotes = sumVigenteCommercialCreditNotes;
exports.remainingCreditable = remainingCreditable;
exports.isIncomeCoveredByCreditNotes = isIncomeCoveredByCreditNotes;
exports.baseFromInclusiveTotal = baseFromInclusiveTotal;
exports.nextCreditNoteFolio = nextCreditNoteFolio;
exports.CREDIT_NOTE_RELATION_TYPE = '01';
function roundCreditMoney(value) {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}
function splitCreditNoteEffect(input) {
    const orderTotal = roundCreditMoney(Math.max(0, Number(input.orderTotal) || 0));
    const amountPaid = roundCreditMoney(Math.max(0, Number(input.amountPaid) || 0));
    const notes = roundCreditMoney(Math.max(0, Number(input.creditNotesTotal) || 0));
    const unpaidBefore = roundCreditMoney(Math.max(0, orderTotal - amountPaid));
    const appliedToPending = roundCreditMoney(Math.min(notes, unpaidBefore));
    const customerCredit = roundCreditMoney(Math.max(0, notes - appliedToPending));
    const pendingAfter = roundCreditMoney(Math.max(0, unpaidBefore - appliedToPending));
    return { unpaidBefore, appliedToPending, customerCredit, pendingAfter };
}
function creditNoteIncrement(input) {
    const before = splitCreditNoteEffect({
        orderTotal: input.orderTotal,
        amountPaid: input.amountPaid,
        creditNotesTotal: input.previousNotesTotal,
    });
    const after = splitCreditNoteEffect({
        orderTotal: input.orderTotal,
        amountPaid: input.amountPaid,
        creditNotesTotal: input.previousNotesTotal + input.noteTotal,
    });
    return {
        appliedToPending: roundCreditMoney(after.appliedToPending - before.appliedToPending),
        customerCredit: roundCreditMoney(after.customerCredit - before.customerCredit),
    };
}
function isInvoiceVigente(invoice) {
    if (invoice.sat_status === 'Cancelado')
        return false;
    if (invoice.sat_status === 'Vigente')
        return true;
    return (invoice.stamp_status === 'stamped' ||
        invoice.stamp_status === 'cancel_pending' ||
        invoice.stamp_status === 'cancel_error');
}
function isCommercialCreditNote(invoice) {
    return invoice.invoice_role === 'credit_note';
}
function isCreditableIncomeInvoice(invoice) {
    const tipo = (invoice.tipo_comprobante || 'I').toUpperCase();
    if (tipo !== 'I')
        return false;
    const role = invoice.invoice_role || 'standard';
    return role === 'standard' || role === 'merchandise';
}
function isEgressDocument(invoice) {
    return ((invoice.tipo_comprobante || '').toUpperCase() === 'E' ||
        invoice.invoice_role === 'credit_note' ||
        invoice.invoice_role === 'advance_application');
}
function sumVigenteCommercialCreditNotes(invoices, relatedInvoiceId) {
    return roundCreditMoney(invoices.reduce((sum, invoice) => {
        if (!isCommercialCreditNote(invoice) || !isInvoiceVigente(invoice))
            return sum;
        if (relatedInvoiceId && invoice.related_invoice_id !== relatedInvoiceId)
            return sum;
        return sum + Number(invoice.total || 0);
    }, 0));
}
function remainingCreditable(invoiceTotal, creditedTotal) {
    return roundCreditMoney(Math.max(0, Number(invoiceTotal || 0) - Number(creditedTotal || 0)));
}
function isIncomeCoveredByCreditNotes(invoice, invoices) {
    if (!isCreditableIncomeInvoice(invoice) || !isInvoiceVigente(invoice))
        return false;
    const credited = sumVigenteCommercialCreditNotes(invoices, invoice.id);
    return credited + 0.009 >= Number(invoice.total || 0) && Number(invoice.total || 0) > 0;
}
function baseFromInclusiveTotal(total, ivaPercentage) {
    const totalCents = Math.round((Number(total) || 0) * 100);
    if (totalCents <= 0)
        return 0;
    if (!(ivaPercentage > 0))
        return totalCents / 100;
    const baseCents = Math.round(totalCents / (1 + ivaPercentage / 100));
    return baseCents / 100;
}
function nextCreditNoteFolio(orderFolio, existingFolios) {
    const root = `${orderFolio}-NC`.slice(0, 40);
    const used = new Set(existingFolios.map((folio) => (folio || '').trim()).filter(Boolean));
    if (!used.has(root))
        return root;
    for (let sequence = 2; sequence < 100; sequence += 1) {
        const candidate = `${orderFolio}-NC-${sequence}`.slice(0, 40);
        if (!used.has(candidate))
            return candidate;
    }
    return `${orderFolio}-NC-${Date.now()}`.slice(0, 40);
}
//# sourceMappingURL=credit-note.util.js.map