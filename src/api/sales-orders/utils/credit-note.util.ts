export const CREDIT_NOTE_RELATION_TYPE = '01';

export function roundCreditMoney(value: number): number {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

export interface CreditNoteMoneyEffect {
  unpaidBefore: number;
  appliedToPending: number;
  customerCredit: number;
  pendingAfter: number;
}

export function splitCreditNoteEffect(input: {
  orderTotal: number;
  amountPaid: number;
  creditNotesTotal: number;
}): CreditNoteMoneyEffect {
  const orderTotal = roundCreditMoney(Math.max(0, Number(input.orderTotal) || 0));
  const amountPaid = roundCreditMoney(Math.max(0, Number(input.amountPaid) || 0));
  const notes = roundCreditMoney(Math.max(0, Number(input.creditNotesTotal) || 0));
  const unpaidBefore = roundCreditMoney(Math.max(0, orderTotal - amountPaid));
  const appliedToPending = roundCreditMoney(Math.min(notes, unpaidBefore));
  const customerCredit = roundCreditMoney(Math.max(0, notes - appliedToPending));
  const pendingAfter = roundCreditMoney(Math.max(0, unpaidBefore - appliedToPending));
  return { unpaidBefore, appliedToPending, customerCredit, pendingAfter };
}

export function creditNoteIncrement(input: {
  orderTotal: number;
  amountPaid: number;
  previousNotesTotal: number;
  noteTotal: number;
}): { appliedToPending: number; customerCredit: number } {
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

export interface CreditNoteInvoiceRef {
  id: string;
  invoice_role?: string | null;
  tipo_comprobante?: string | null;
  related_invoice_id?: string | null;
  total?: number | string | null;
  sat_status?: string | null;
  stamp_status?: string | null;
  uuid?: string | null;
}

export function isInvoiceVigente(invoice: {
  sat_status?: string | null;
  stamp_status?: string | null;
}): boolean {
  if (invoice.sat_status === 'Cancelado') return false;
  if (invoice.sat_status === 'Vigente') return true;
  return (
    invoice.stamp_status === 'stamped' ||
    invoice.stamp_status === 'cancel_pending' ||
    invoice.stamp_status === 'cancel_error'
  );
}

export function isCommercialCreditNote(invoice: CreditNoteInvoiceRef): boolean {
  return invoice.invoice_role === 'credit_note';
}

export function isCreditableIncomeInvoice(invoice: CreditNoteInvoiceRef): boolean {
  const tipo = (invoice.tipo_comprobante || 'I').toUpperCase();
  if (tipo !== 'I') return false;
  const role = invoice.invoice_role || 'standard';
  return role === 'standard' || role === 'merchandise';
}

export function isEgressDocument(invoice: CreditNoteInvoiceRef): boolean {
  return (
    (invoice.tipo_comprobante || '').toUpperCase() === 'E' ||
    invoice.invoice_role === 'credit_note' ||
    invoice.invoice_role === 'advance_application'
  );
}

export function sumVigenteCommercialCreditNotes(
  invoices: CreditNoteInvoiceRef[],
  relatedInvoiceId?: string,
): number {
  return roundCreditMoney(
    invoices.reduce((sum, invoice) => {
      if (!isCommercialCreditNote(invoice) || !isInvoiceVigente(invoice)) return sum;
      if (relatedInvoiceId && invoice.related_invoice_id !== relatedInvoiceId) return sum;
      return sum + Number(invoice.total || 0);
    }, 0),
  );
}

export function remainingCreditable(invoiceTotal: number, creditedTotal: number): number {
  return roundCreditMoney(Math.max(0, Number(invoiceTotal || 0) - Number(creditedTotal || 0)));
}

export function isIncomeCoveredByCreditNotes(
  invoice: CreditNoteInvoiceRef,
  invoices: CreditNoteInvoiceRef[],
): boolean {
  if (!isCreditableIncomeInvoice(invoice) || !isInvoiceVigente(invoice)) return false;
  const credited = sumVigenteCommercialCreditNotes(invoices, invoice.id);
  return credited + 0.009 >= Number(invoice.total || 0) && Number(invoice.total || 0) > 0;
}

export function baseFromInclusiveTotal(total: number, ivaPercentage: number): number {
  const totalCents = Math.round((Number(total) || 0) * 100);
  if (totalCents <= 0) return 0;
  if (!(ivaPercentage > 0)) return totalCents / 100;
  const baseCents = Math.round(totalCents / (1 + ivaPercentage / 100));
  return baseCents / 100;
}

export function nextCreditNoteFolio(
  orderFolio: string,
  existingFolios: Array<string | null | undefined>,
): string {
  const root = `${orderFolio}-NC`.slice(0, 40);
  const used = new Set(existingFolios.map((folio) => (folio || '').trim()).filter(Boolean));
  if (!used.has(root)) return root;
  for (let sequence = 2; sequence < 100; sequence += 1) {
    const candidate = `${orderFolio}-NC-${sequence}`.slice(0, 40);
    if (!used.has(candidate)) return candidate;
  }
  return `${orderFolio}-NC-${Date.now()}`.slice(0, 40);
}
