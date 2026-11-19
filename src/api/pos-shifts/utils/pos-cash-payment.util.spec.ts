import {
    cashCoversOrder,
    cashReceivedEquivalentMxn,
    displayCashChange,
    splitCashPayment,
} from './pos-cash-payment.util';

describe('pos-cash-payment.util', () => {
    it('100 USD a 16.80 sobre 1079.65 deja cambio 35.74 USD', () => {
        const split = splitCashPayment(1079.65, 0, 100, 16.8);

        expect(cashReceivedEquivalentMxn(0, 100, 16.8)).toBe(1680);
        expect(split.amountCashMxn).toBe(0);
        expect(split.amountCashUsd).toBe(64.26);
        expect(split.changeCashMxn).toBe(0);
        expect(split.changeCashUsd).toBe(35.74);
        expect(split.covers).toBe(true);
        expect(cashCoversOrder(1079.65, 0, 100, 16.8)).toBe(true);
    });

    it('64.26 USD a 16.80 cubren 1079.65 aunque 64.26 × 16.80 = 1079.57', () => {
        const split = splitCashPayment(1079.65, 0, 64.26, 16.8);

        expect(cashReceivedEquivalentMxn(0, 64.26, 16.8)).toBe(1079.57);
        expect(split.amountCashUsd).toBe(64.26);
        expect(split.changeCashUsd).toBe(0);
        expect(split.covers).toBe(true);
    });

    it('pesos primero y el sobrante de dólares se devuelve en USD', () => {
        const split = splitCashPayment(1079.65, 500, 50, 16.8);

        expect(split.amountCashMxn).toBe(500);
        expect(split.amountCashUsd).toBe(34.5);
        expect(split.changeCashMxn).toBe(0);
        expect(split.changeCashUsd).toBe(15.5);
        expect(split.covers).toBe(true);
    });

    it('solo pesos: el cambio sale en MXN', () => {
        const split = splitCashPayment(830.5, 1000, 0, 0);

        expect(split.amountCashMxn).toBe(830.5);
        expect(split.changeCashMxn).toBe(169.5);
        expect(split.changeCashUsd).toBe(0);
        expect(split.covers).toBe(true);
    });

    it('no cubre si faltan dólares de verdad', () => {
        expect(cashCoversOrder(1079.65, 0, 60, 16.8)).toBe(false);
    });

    it('el cambio en dólares también se muestra en pesos', () => {
        const shown = displayCashChange(0, 35.74, 16.8);
        expect(shown.usd).toBe(35.74);
        expect(shown.mxn).toBe(600.43);
    });
});
