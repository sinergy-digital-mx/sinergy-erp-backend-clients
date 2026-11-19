import {
  baseFromInclusiveTotal,
  creditNoteIncrement,
  isIncomeCoveredByCreditNotes,
  nextCreditNoteFolio,
  splitCreditNoteEffect,
} from './credit-note.util';
import { buildSalesCreditNoteCfdi } from './credit-note-cfdi.util';

describe('credit note effect', () => {
  it('baja el pendiente cuando la factura no está pagada', () => {
    expect(
      splitCreditNoteEffect({ orderTotal: 1000, amountPaid: 0, creditNotesTotal: 200 }),
    ).toEqual({
      unpaidBefore: 1000,
      appliedToPending: 200,
      customerCredit: 0,
      pendingAfter: 800,
    });
  });

  it('deja saldo a favor cuando la orden ya está pagada', () => {
    expect(
      splitCreditNoteEffect({ orderTotal: 1000, amountPaid: 1000, creditNotesTotal: 1000 }),
    ).toEqual({
      unpaidBefore: 0,
      appliedToPending: 0,
      customerCredit: 1000,
      pendingAfter: 0,
    });
  });

  it('aplica al pendiente y el sobrante queda a favor', () => {
    expect(
      splitCreditNoteEffect({ orderTotal: 1000, amountPaid: 400, creditNotesTotal: 700 }),
    ).toEqual({
      unpaidBefore: 600,
      appliedToPending: 600,
      customerCredit: 100,
      pendingAfter: 0,
    });
  });

  it('no vuelve a contar las notas anteriores', () => {
    expect(
      creditNoteIncrement({
        orderTotal: 1000,
        amountPaid: 0,
        previousNotesTotal: 200,
        noteTotal: 900,
      }),
    ).toEqual({ appliedToPending: 800, customerCredit: 100 });
  });

  it('cubre la factura cuando las notas vigentes alcanzan su total', () => {
    const income = {
      id: 'fac-1',
      invoice_role: 'standard',
      tipo_comprobante: 'I',
      total: 500,
      sat_status: 'Vigente',
      stamp_status: 'stamped',
    };
    const notes = [
      {
        id: 'nc-1',
        invoice_role: 'credit_note',
        tipo_comprobante: 'E',
        related_invoice_id: 'fac-1',
        total: 500,
        sat_status: 'Vigente',
        stamp_status: 'stamped',
      },
    ];
    expect(isIncomeCoveredByCreditNotes(income, [income, ...notes])).toBe(true);
  });

  it('arma el folio consecutivo', () => {
    expect(nextCreditNoteFolio('OSV-1', [])).toBe('OSV-1-NC');
    expect(nextCreditNoteFolio('OSV-1', ['OSV-1-NC'])).toBe('OSV-1-NC-2');
  });

  it('cuadra la base con el IVA y relaciona la factura con tipo 01', () => {
    expect(baseFromInclusiveTotal(1160, 16)).toBe(1000);
    const built = buildSalesCreditNoteCfdi({
      folio: 'OSV-1-NC',
      totalAmount: 1160,
      ivaPercentage: 16,
      usoCfdi: 'G02',
      formaPago: '03',
      emisor: {
        rfc: 'AAA010101AAA',
        nombre: 'EMISOR',
        regimen: '601',
        postalCode: '22000',
      },
      receptor: {
        rfc: 'XAXX010101000',
        nombre: 'PUBLICO',
        regimen: '616',
        postalCode: '22000',
      },
      descripcion: 'Diferencia de precio',
      relatedUuid: '11111111-1111-1111-1111-111111111111',
      currency: 'USD',
      exchangeRate: 18.5,
    });
    expect(built.total).toBe(1160);
    expect(built.xml).toContain('TipoRelacion="01"');
    expect(built.xml).toContain('TipoDeComprobante="E"');
    expect(built.xml).toContain('Moneda="USD"');
    expect(built.xml).toContain('TipoCambio="18.500000"');
    expect(built.xml).toContain('UsoCFDI="G02"');
  });
});
