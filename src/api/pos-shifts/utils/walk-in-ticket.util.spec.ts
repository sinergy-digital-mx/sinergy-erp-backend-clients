import {
    isValidWalkInRfc,
    normalizeWalkInName,
    normalizeWalkInRfc,
} from './walk-in-ticket.util';

describe('walk-in-ticket.util', () => {
    it('nombre: recorta y vacía a null', () => {
        expect(normalizeWalkInName('  Juan Pérez  ')).toBe('Juan Pérez');
        expect(normalizeWalkInName('')).toBeNull();
        expect(normalizeWalkInName('   ')).toBeNull();
    });

    it('RFC: mayúsculas y sin espacios', () => {
        expect(normalizeWalkInRfc(' caxx 010101 000 ')).toBe('CAXX010101000');
        expect(normalizeWalkInRfc('')).toBeNull();
    });

    it('RFC válido 12 o 13', () => {
        expect(isValidWalkInRfc('XAXX010101000')).toBe(true);
        expect(isValidWalkInRfc('ABC010101ABC')).toBe(true);
        expect(isValidWalkInRfc('ABC')).toBe(false);
        expect(isValidWalkInRfc('')).toBe(true);
    });
});
