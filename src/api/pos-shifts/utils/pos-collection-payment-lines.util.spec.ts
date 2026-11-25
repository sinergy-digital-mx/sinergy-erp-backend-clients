import { PosSalePaymentMethod } from '../../../entities/pos/pos-sale-payment-method.enum';
import {
  assignPosTenderCashierNotes,
  buildPosTenderPaymentLines,
} from './pos-collection-payment-lines.util';

describe('buildPosTenderPaymentLines', () => {
  it('separa cada tarjeta de un cobro mixto con su voucher', () => {
    const lines = buildPosTenderPaymentLines(
      {
        cardPayments: [
          { amount_mxn: 350, reference: null, card_kind: 'debit' },
          { amount_mxn: 1100, reference: '000053', card_kind: 'debit' },
          { amount_mxn: 1755.46, reference: '000054', card_kind: 'credit' },
        ],
      },
      3205.46,
    );

    expect(lines).toEqual([
      {
        method: PosSalePaymentMethod.CARD,
        amount: 350,
        reference: null,
        notes: 'Débito',
      },
      {
        method: PosSalePaymentMethod.CARD,
        amount: 1100,
        reference: '000053',
        notes: 'Débito',
      },
      {
        method: PosSalePaymentMethod.CARD,
        amount: 1755.46,
        reference: '000054',
        notes: 'Crédito',
      },
    ]);
  });

  it('separa cada transferencia de un cobro mixto con su referencia', () => {
    const lines = buildPosTenderPaymentLines(
      {
        transferPayments: [
          { amount_mxn: 400, reference: 'SPEI-1' },
          { amount_mxn: 430.5, reference: 'SPEI-2' },
        ],
        amountCashMxn: 100,
      },
      930.5,
    );

    expect(lines?.map((line) => [line.method, line.amount, line.reference])).toEqual([
      [PosSalePaymentMethod.CASH, 100, null],
      [PosSalePaymentMethod.TRANSFER, 400, 'SPEI-1'],
      [PosSalePaymentMethod.TRANSFER, 430.5, 'SPEI-2'],
    ]);
  });

  it('separa efectivo, transferencia y tarjeta', () => {
    const lines = buildPosTenderPaymentLines(
      {
        amountCashMxn: 200,
        amountTransferMxn: 500,
        transferReference: 'SPEI-99',
        cardPayments: [{ amount_mxn: 300, reference: '4242', card_kind: 'debit' }],
      },
      1000,
    );

    expect(lines?.map((line) => [line.method, line.amount, line.reference])).toEqual([
      [PosSalePaymentMethod.CASH, 200, null],
      [PosSalePaymentMethod.TRANSFER, 500, 'SPEI-99'],
      [PosSalePaymentMethod.CARD, 300, '4242'],
    ]);
  });

  it('convierte el dólar a pesos y ajusta el centavo para cuadrar el total', () => {
    const lines = buildPosTenderPaymentLines(
      {
        amountCashUsd: 10,
        usdExchangeRate: 17.255,
        amountCardMxn: 100,
        cardReference: '1',
        cardKind: 'debit',
      },
      272.55,
    );

    expect(lines?.[0]).toMatchObject({
      method: PosSalePaymentMethod.CASH,
      notes: '10.00 USD · TC 17.255',
    });
    const sum = (lines ?? []).reduce((total, line) => total + line.amount, 0);
    expect(Number(sum.toFixed(2))).toBe(272.55);
  });

  it('no parte un cobro que no cuadra con el pago guardado', () => {
    expect(
      buildPosTenderPaymentLines(
        {
          cardPayments: [
            { amount_mxn: 350, card_kind: 'debit' },
            { amount_mxn: 1100, card_kind: 'debit' },
          ],
        },
        3205.46,
      ),
    ).toBeNull();
  });
});

describe('assignPosTenderCashierNotes', () => {
  it('deja la nota del cajero solo en el primer pago', () => {
    const lines = assignPosTenderCashierNotes(
      [
        {
          method: PosSalePaymentMethod.CARD,
          amount: 10,
          reference: null,
          notes: 'Débito',
        },
        {
          method: PosSalePaymentMethod.CARD,
          amount: 20,
          reference: '2',
          notes: 'Crédito',
        },
      ],
      '  Ticket en mano  ',
    );

    expect(lines.map((line) => line.notes)).toEqual(['Débito · Ticket en mano', 'Crédito']);
  });
});
