import { VendorType } from '../../../entities/vendor/vendor-type.enum';
import {
  computeVendorCompleteness,
  findSimilarVendors,
  normalizeVendorName,
  pickBestSimilarVendor,
} from './vendor-profile.util';

describe('vendor-profile.util', () => {
  describe('computeVendorCompleteness', () => {
    it('da 0 si un nacional no tiene datos útiles', () => {
      expect(computeVendorCompleteness({ vendor_type: VendorType.NATIONAL })).toBe(0);
    });

    it('sube al llenar identidad fiscal y dirección', () => {
      const percent = computeVendorCompleteness({
        vendor_type: VendorType.NATIONAL,
        name: 'Acme',
        company_name: 'Acme SA',
        rfc: 'ACM010101ABC',
        razon_social: 'Acme SA de CV',
        street: 'Calle 1',
        city: 'Tijuana',
        state: 'BC',
        zip_code: '22000',
      });
      expect(percent).toBeGreaterThanOrEqual(60);
      expect(percent).toBeLessThan(100);
    });

    it('trata strings vacíos como incompletos', () => {
      const percent = computeVendorCompleteness({
        vendor_type: VendorType.INTERNATIONAL,
        name: 'US Co',
        legal_name: 'US Co LLC',
        country: 'US',
        street: '',
        city: '   ',
        tax_id: null,
      });
      expect(percent).toBeLessThan(50);
    });
  });

  describe('normalizeVendorName', () => {
    it('quita sufijos legales y acentos', () => {
      expect(normalizeVendorName('ACME S.A. de C.V.')).toBe('acme');
      expect(normalizeVendorName('Compañía López')).toBe('compania lopez');
    });
  });

  describe('findSimilarVendors', () => {
    it('marca RFC igual o casi igual', () => {
      const matches = findSimilarVendors(
        { id: 'a', name: 'Uno', rfc: 'ACM010101AAA' },
        [{ id: 'b', name: 'Dos', rfc: 'ACM010101AAB' }],
      );
      expect(matches).toHaveLength(1);
      expect(matches[0].match_reasons).toContain('rfc');
    });

    it('marca empresas equivalentes con sufijo de sociedad', () => {
      const matches = findSimilarVendors(
        { id: 'a', name: 'Acme SA de CV' },
        [{ id: 'b', name: 'ACME', company_name: 'Acme' }],
      );
      expect(matches[0].match_reasons).toContain('company');
      expect(matches[0].name).toBe('Acme');
    });

    it('no compara contra sí mismo', () => {
      const matches = findSimilarVendors(
        { id: 'a', name: 'Acme', rfc: 'ACM010101AAA' },
        [{ id: 'a', name: 'Acme', rfc: 'ACM010101AAA' }],
      );
      expect(matches).toHaveLength(0);
    });

    it('detecta CLABE igual', () => {
      const matches = findSimilarVendors(
        { id: 'a', name: 'Banco A', bank_clabe: '012345678901234567' },
        [{ id: 'b', name: 'Otro', bank_clabe: '012345678901234567' }],
      );
      expect(matches[0].match_reasons).toContain('bank');
    });
  });

  describe('pickBestSimilarVendor', () => {
    it('prefiere el que tiene más compras', () => {
      const picked = pickBestSimilarVendor(
        [
          { id: 'x', name: 'X', company_name: null, rfc: null, tax_id: null, match_reasons: ['name'], score: 90 },
          { id: 'y', name: 'Y', company_name: null, rfc: null, tax_id: null, match_reasons: ['name'], score: 80 },
        ],
        [{ id: 'x' }, { id: 'y' }],
        new Map([
          ['x', 1],
          ['y', 9],
        ]),
        new Map([
          ['x', 90],
          ['y', 10],
        ]),
      );
      expect(picked?.id).toBe('y');
    });
  });
});
