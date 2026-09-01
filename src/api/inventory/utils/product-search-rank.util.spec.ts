import {
  applyProductSearchFilter,
  applyProductSearchOrder,
  buildProductSearchRankSql,
  compareProductSearchRelevance,
  getProductSearchRank,
  parseProductSearchTokens,
} from './product-search-rank.util';

describe('product-search-rank.util', () => {
  describe('parseProductSearchTokens', () => {
    it('splits words and strips accents', () => {
      expect(parseProductSearchTokens('  Pino  2x4  ')).toEqual(['pino', '2x4']);
      expect(parseProductSearchTokens('Lámina')).toEqual(['lamina']);
    });

    it('ignores LIKE wildcards', () => {
      expect(parseProductSearchTokens('%pino_')).toEqual(['pino']);
    });
  });

  describe('applyProductSearchFilter', () => {
    it('uses column LIKE without wrapping functions', () => {
      const clauses: string[] = [];
      const params: Record<string, unknown>[] = [];
      const qb = {
        andWhere: (sql: string, sqlParams?: Record<string, unknown>) => {
          clauses.push(sql);
          if (sqlParams) params.push(sqlParams);
          return qb;
        },
      };

      applyProductSearchFilter(qb as never, 'Pino');

      expect(clauses).toHaveLength(1);
      expect(clauses[0]).toContain('product.sku LIKE :productSearchToken0');
      expect(clauses[0]).not.toContain('REPLACE');
      expect(clauses[0]).not.toContain('LOWER(');
      expect(clauses[0]).not.toContain('translate');
      expect(params[0]).toEqual({ productSearchToken0: '%pino%' });
    });

    it('requires every token', () => {
      const clauses: string[] = [];
      const qb = {
        andWhere: (sql: string) => {
          clauses.push(sql);
          return qb;
        },
      };

      applyProductSearchFilter(qb as never, 'pino 2x4');
      expect(clauses).toHaveLength(2);
    });
  });

  describe('applyProductSearchOrder', () => {
    it('ranks exact SKU first and does not wipe existing params', () => {
      const parameters: Record<string, string> = { productSearchToken0: '%pino%' };
      const qb = {
        addSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        setParameter: jest.fn((key: string, value: string) => {
          parameters[key] = value;
          return qb;
        }),
      };

      applyProductSearchOrder(qb as never, 'Pino', true);

      expect(qb.addSelect).toHaveBeenCalledWith(buildProductSearchRankSql(true), 'search_rank');
      expect(qb.orderBy).toHaveBeenCalledWith('search_rank', 'ASC');
      expect(parameters.productSearchToken0).toBe('%pino%');
      expect(parameters.productSearchExact).toBe('pino');
      expect(parameters.productSearchPrefix).toBe('pino%');
      expect(buildProductSearchRankSql(true)).toContain(
        'WHEN MAX(product.sku) = :productSearchExact THEN 0',
      );
    });
  });

  describe('compareProductSearchRelevance', () => {
    function sortedSkus(
      search: string,
      products: Array<{ sku: string; name: string; external_sku?: string }>,
    ) {
      return [...products]
        .sort((a, b) => compareProductSearchRelevance(a, b, search))
        .map((product) => product.sku);
    }

    it('puts exact SKU match first even if the name sorts last', () => {
      expect(
        sortedSkus('10', [
          { sku: 'AA-10', name: 'Aaa 10mm' },
          { sku: '10', name: 'Zanahoria' },
          { sku: 'ZZ-1', name: 'Producto 10 kilos' },
        ]),
      ).toEqual(['10', 'AA-10', 'ZZ-1']);
    });

    it('ranks SKU prefix before name matches', () => {
      expect(
        sortedSkus('PIN', [
          { sku: 'XYZ', name: 'Pino 2x4' },
          { sku: 'PINO-01', name: 'Zeta' },
          { sku: 'ABC', name: 'Alpino' },
        ]),
      ).toEqual(['PINO-01', 'XYZ', 'ABC']);
    });

    it('ranks name prefix, then word, then contains', () => {
      expect(
        sortedSkus('pino', [
          { sku: 'C', name: 'Alpino chocolate' },
          { sku: 'B', name: 'Madera de pino' },
          { sku: 'A', name: 'Pino 2x4' },
        ]),
      ).toEqual(['A', 'B', 'C']);
    });

    it('matches names without accents', () => {
      const lamina = { sku: 'LAM-1', name: 'Lámina galvanizada' };
      const other = { sku: 'ZZZ', name: 'Tornillo' };
      expect(compareProductSearchRelevance(lamina, other, 'lamina')).toBeLessThan(0);
      expect(getProductSearchRank(lamina, 'lamina').tier).toBeLessThan(
        getProductSearchRank(other, 'lamina').tier,
      );
    });

    it('treats exact external SKU like a SKU hit', () => {
      expect(
        sortedSkus('EXT-9', [
          { sku: 'AAA', name: 'Aaa EXT-9 especial' },
          { sku: 'BBB', name: 'Zeta', external_sku: 'EXT-9' },
        ]),
      ).toEqual(['BBB', 'AAA']);
    });
  });
});
