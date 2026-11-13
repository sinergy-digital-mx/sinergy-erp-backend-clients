import { isFiscalFlagOn } from '../../billing/utils/fiscal-tax-policy.util';

export type LocationWarehouseInput = {
  id: string;
  name: string;
  status: string;
  billing_branch_id?: string | null;
};

export type LocationBranchInput = {
  id: string;
  fiscal_configuration_id: string;
  code: string;
  status: number;
};

export type LocationFiscalInput = {
  id: string;
  razon_social: string;
  rfc: string;
  status: string;
  iva_enabled?: boolean | number | null;
  ieps_enabled?: boolean | number | null;
  multi_fiscal_transfers_enabled?: boolean | number | null;
};

export type PurchaseOrderLocationWarehouse = {
  id: string;
  name: string;
  status: string;
};

export type PurchaseOrderLocationBranch = {
  id: string;
  name: string;
  status: number;
  warehouses: PurchaseOrderLocationWarehouse[];
};

export type PurchaseOrderLocationFiscal = {
  id: string;
  razon_social: string;
  rfc: string;
  status: string;
  iva_enabled: boolean;
  ieps_enabled: boolean;
  multi_fiscal_transfers_enabled: boolean;
  branches: PurchaseOrderLocationBranch[];
};

export type PurchaseOrderLocationTree = {
  data: PurchaseOrderLocationFiscal[];
  unassigned_warehouses: PurchaseOrderLocationWarehouse[];
};

function toWarehouseNode(
  warehouse: LocationWarehouseInput,
): PurchaseOrderLocationWarehouse {
  return {
    id: warehouse.id,
    name: warehouse.name,
    status: warehouse.status,
  };
}

export function buildPurchaseOrderLocationTree(
  fiscals: LocationFiscalInput[],
  branches: LocationBranchInput[],
  warehouses: LocationWarehouseInput[],
): PurchaseOrderLocationTree {
  const branchIds = new Set(branches.map((branch) => branch.id));
  const warehousesByBranch = new Map<string, PurchaseOrderLocationWarehouse[]>();
  const unassigned_warehouses: PurchaseOrderLocationWarehouse[] = [];

  for (const warehouse of warehouses) {
    const branchId = warehouse.billing_branch_id ?? null;
    if (!branchId || !branchIds.has(branchId)) {
      unassigned_warehouses.push(toWarehouseNode(warehouse));
      continue;
    }
    const list = warehousesByBranch.get(branchId) ?? [];
    list.push(toWarehouseNode(warehouse));
    warehousesByBranch.set(branchId, list);
  }

  const branchesByFiscal = new Map<string, LocationBranchInput[]>();
  for (const branch of branches) {
    const list = branchesByFiscal.get(branch.fiscal_configuration_id) ?? [];
    list.push(branch);
    branchesByFiscal.set(branch.fiscal_configuration_id, list);
  }

  return {
    data: fiscals.map((fiscal) => ({
      id: fiscal.id,
      razon_social: fiscal.razon_social,
      rfc: fiscal.rfc,
      status: fiscal.status,
      iva_enabled: isFiscalFlagOn(fiscal.iva_enabled, true),
      ieps_enabled: isFiscalFlagOn(fiscal.ieps_enabled, true),
      multi_fiscal_transfers_enabled: isFiscalFlagOn(
        fiscal.multi_fiscal_transfers_enabled,
        true,
      ),
      branches: (branchesByFiscal.get(fiscal.id) ?? []).map((branch) => ({
        id: branch.id,
        name: branch.code,
        status: branch.status,
        warehouses: warehousesByBranch.get(branch.id) ?? [],
      })),
    })),
    unassigned_warehouses,
  };
}
