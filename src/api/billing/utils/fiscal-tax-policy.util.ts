import { DataSource, EntityManager } from 'typeorm';

export interface FiscalTaxPolicy {
  ivaEnabled: boolean;
  iepsEnabled: boolean;
}

type Queryable = Pick<DataSource | EntityManager, 'query'>;

export function isFiscalFlagOn(value: unknown, fallback = true): boolean {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  if (value === false || value === 0 || value === '0' || value === 'false') {
    return false;
  }
  return value === true || value === 1 || value === '1' || value === 'true';
}

export function readFiscalTaxPolicy(
  row: { iva_enabled?: unknown; ieps_enabled?: unknown } | null | undefined,
): FiscalTaxPolicy {
  return {
    ivaEnabled: isFiscalFlagOn(row?.iva_enabled, true),
    iepsEnabled: isFiscalFlagOn(row?.ieps_enabled, true),
  };
}

export function clampTaxPercentages(
  ivaPercentage: number,
  iepsPercentage: number,
  policy: FiscalTaxPolicy,
): { ivaPercentage: number; iepsPercentage: number } {
  return {
    ivaPercentage: policy.ivaEnabled ? ivaPercentage : 0,
    iepsPercentage: policy.iepsEnabled ? iepsPercentage : 0,
  };
}

export async function loadTenantIepsEnabled(
  db: Queryable,
  tenantId: string,
): Promise<boolean> {
  const active: Array<{ ieps_enabled?: unknown }> = await db.query(
    `SELECT ieps_enabled
     FROM fiscal_configurations
     WHERE tenant_id = ? AND status = 'active'`,
    [tenantId],
  );
  const rows: Array<{ ieps_enabled?: unknown }> = active?.length
    ? active
    : await db.query(
        `SELECT ieps_enabled FROM fiscal_configurations WHERE tenant_id = ?`,
        [tenantId],
      );
  if (!rows?.length) return true;
  return rows.some((row) => isFiscalFlagOn(row?.ieps_enabled, true));
}

export function columnsWithoutDisabledIeps<T extends { key: string; header: string }>(
  columns: T[],
  iepsEnabled: boolean,
): T[] {
  if (iepsEnabled) return columns;
  return columns.filter((column) => !/ieps/i.test(`${column.key} ${column.header}`));
}

export async function loadFiscalTaxPolicy(
  db: Queryable,
  fiscalConfigurationId: string,
  tenantId: string,
): Promise<FiscalTaxPolicy> {
  if (!fiscalConfigurationId) {
    return { ivaEnabled: true, iepsEnabled: true };
  }
  const rows = await db.query(
    `SELECT iva_enabled, ieps_enabled
     FROM fiscal_configurations
     WHERE id = ? AND tenant_id = ?
     LIMIT 1`,
    [fiscalConfigurationId, tenantId],
  );
  return readFiscalTaxPolicy(rows?.[0]);
}
