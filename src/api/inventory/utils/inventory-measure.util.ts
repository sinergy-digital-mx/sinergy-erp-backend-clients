export type MeasureQuantityInput = {
  measure?: unknown;
  measure_uom_id?: unknown;
  measure_uom_name?: unknown;
  measure_uom?: { id?: string | null; name?: string | null } | null;
  available_quantity?: unknown;
  initial_quantity?: unknown;
};

export type MeasureTotal = {
  measure: string | null;
  measure_uom_id: string | null;
  measure_uom_name: string | null;
  measure_label: string | null;
  total_available_quantity: string;
  total_initial_quantity: string;
  total_batches: number;
};

export type BatchMeasureFields = {
  measure: string | null;
  measure_uom_id: string | null;
  measure_uom_name: string | null;
  measure_label: string | null;
};

function parseQty(value: unknown): number {
  const parsed = parseFloat(String(value ?? 0));
  return Number.isFinite(parsed) ? parsed : 0;
}

function cleanName(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const name = value.trim();
  return name || null;
}

/** Convierte 12.000 → "12", 8.5 → "8.5". Null si no hay tamaño. */
export function formatMeasure(value: unknown): string | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const parsed = typeof value === 'number' ? value : parseFloat(String(value));
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return String(Number(parsed.toFixed(3)));
}

export function normalizeMeasure(value: unknown): number | null {
  const formatted = formatMeasure(value);
  if (formatted === null) {
    return null;
  }
  return Number(formatted);
}

/** "8 Foot" / "12 PIES". Nunca usa la UOM de inventario (PT, ft²). */
export function formatMeasureLabel(measure: unknown, uomName?: unknown): string | null {
  const size = formatMeasure(measure);
  if (!size) {
    return null;
  }
  const name = cleanName(uomName);
  return name ? `${size} ${name}` : size;
}

export function mapBatchMeasure(batch: {
  measure?: unknown;
  measure_uom_id?: unknown;
  measure_uom?: { id?: string | null; name?: string | null } | null;
  measure_uom_name?: unknown;
}): BatchMeasureFields {
  const measure = formatMeasure(batch.measure);
  if (!measure) {
    return {
      measure: null,
      measure_uom_id: null,
      measure_uom_name: null,
      measure_label: null,
    };
  }
  const measure_uom_id =
    (typeof batch.measure_uom_id === 'string' && batch.measure_uom_id) ||
    batch.measure_uom?.id ||
    null;
  const measure_uom_name =
    cleanName(batch.measure_uom_name) ?? cleanName(batch.measure_uom?.name);
  return {
    measure,
    measure_uom_id,
    measure_uom_name,
    measure_label: formatMeasureLabel(measure, measure_uom_name),
  };
}

function formatQty(value: number): string {
  return (Number.isFinite(value) ? value : 0).toFixed(3);
}

/**
 * Agrupa existencia por tamaño (8 Foot vs 12 PIES). Vacío si ningún lote tiene tamaño.
 */
export function buildMeasureTotals(batches: MeasureQuantityInput[]): MeasureTotal[] {
  const mapped = batches.map((batch) => ({
    fields: mapBatchMeasure(batch),
    available: parseQty(batch.available_quantity),
    initial: parseQty(batch.initial_quantity),
  }));
  const hasAny = mapped.some((row) => row.fields.measure !== null);
  if (!hasAny) {
    return [];
  }

  const groups = new Map<
    string,
    {
      fields: BatchMeasureFields;
      available: number;
      initial: number;
      count: number;
    }
  >();

  for (const row of mapped) {
    const key = row.fields.measure
      ? `${row.fields.measure}|${row.fields.measure_uom_id ?? ''}`
      : '__none__';
    const existing = groups.get(key) ?? {
      fields: row.fields,
      available: 0,
      initial: 0,
      count: 0,
    };
    existing.available += row.available;
    existing.initial += row.initial;
    existing.count += 1;
    groups.set(key, existing);
  }

  return [...groups.values()]
    .sort((a, b) => {
      if (a.fields.measure === null) return 1;
      if (b.fields.measure === null) return -1;
      const sizeDiff = Number(a.fields.measure) - Number(b.fields.measure);
      if (sizeDiff !== 0) return sizeDiff;
      return (a.fields.measure_uom_name ?? '').localeCompare(
        b.fields.measure_uom_name ?? '',
      );
    })
    .map((row) => ({
      measure: row.fields.measure,
      measure_uom_id: row.fields.measure_uom_id,
      measure_uom_name: row.fields.measure_uom_name,
      measure_label: row.fields.measure_label,
      total_available_quantity: formatQty(row.available),
      total_initial_quantity: formatQty(row.initial),
      total_batches: row.count,
    }));
}

export function formatMeasureTotalsLabel(totals: MeasureTotal[]): string {
  if (!totals.length) {
    return '';
  }
  return totals
    .map(
      (row) =>
        `${row.measure_label ?? row.measure ?? 'Sin medida'} → ${row.total_available_quantity}`,
    )
    .join(' · ');
}
