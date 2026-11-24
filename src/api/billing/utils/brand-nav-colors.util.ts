import { createHash } from 'crypto';

/**
 * Degradado vertical del menú: arriba 0%, centro 50%, abajo 100%.
 * Vacío en base = estos tres. El de arriba también pinta el fondo en celular.
 */
export const DEFAULT_BRAND_NAV_COLORS = {
  start: '#1e1b4b',
  mid: '#312e81',
  end: '#4c1d95',
} as const;

const HEX = /^#[0-9a-fA-F]{6}$/;

export interface BrandNavColorColumns {
  brand_color_start?: string | null;
  brand_color_mid?: string | null;
  brand_color_end?: string | null;
  pos_sales_bar_color?: string | null;
  pos_cash_bar_color?: string | null;
}

export interface BrandNavMeta {
  cache_key: string;
  start: string;
  mid: string;
  end: string;
  pos_sales: string | null;
  pos_cash: string | null;
}

export function normalizeBrandHex(value: string | null | undefined, fallback: string): string {
  const raw = String(value ?? '').trim();
  return HEX.test(raw) ? raw.toLowerCase() : fallback;
}

function optionalBrandHex(value: string | null | undefined): string | null {
  const raw = String(value ?? '').trim();
  return HEX.test(raw) ? raw.toLowerCase() : null;
}

/** Colores efectivos del menú y una clave corta para la caché del navegador. */
export function resolveBrandNavMeta(row: BrandNavColorColumns | null | undefined): BrandNavMeta {
  const start = normalizeBrandHex(row?.brand_color_start, DEFAULT_BRAND_NAV_COLORS.start);
  const mid = normalizeBrandHex(row?.brand_color_mid, DEFAULT_BRAND_NAV_COLORS.mid);
  const end = normalizeBrandHex(row?.brand_color_end, DEFAULT_BRAND_NAV_COLORS.end);
  const posSales = optionalBrandHex(row?.pos_sales_bar_color);
  const posCash = optionalBrandHex(row?.pos_cash_bar_color);
  return {
    cache_key: createHash('sha256')
      .update(`${start}|${mid}|${end}|${posSales ?? ''}|${posCash ?? ''}`)
      .digest('hex')
      .slice(0, 16),
    start,
    mid,
    end,
    pos_sales: posSales,
    pos_cash: posCash,
  };
}
