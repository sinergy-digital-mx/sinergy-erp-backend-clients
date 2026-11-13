import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { entityCodesMatch } from '../../rbac/utils/entity-code.util';

export type QuotationSellerAccess = {
  userId: string;
  canViewAll: boolean;
  canViewAllBranches: boolean;
  assignedBranchIds?: string[];
};

function listJwtPermissionStrings(
  user: { permissions?: unknown } | null | undefined,
): string[] {
  const permissions = user?.permissions;
  if (Array.isArray(permissions)) {
    return permissions.filter((item): item is string => typeof item === 'string');
  }
  if (!permissions || typeof permissions !== 'object') {
    return [];
  }

  const flat: string[] = [];
  for (const [module, actions] of Object.entries(
    permissions as Record<string, unknown>,
  )) {
    if (!Array.isArray(actions)) {
      continue;
    }
    for (const action of actions) {
      const actionStr =
        typeof action === 'string'
          ? action
          : action && typeof action === 'object'
            ? String((action as { action?: unknown }).action ?? '')
            : '';
      if (actionStr) {
        flat.push(`${module}:${actionStr}`);
      }
    }
  }
  return flat;
}

function jwtHasQuotationAction(
  user: { permissions?: unknown } | null | undefined,
  actionNormalized: string,
): boolean {
  return listJwtPermissionStrings(user).some((raw) => {
    const colon = raw.indexOf(':');
    if (colon <= 0) {
      return false;
    }
    const entity = raw.slice(0, colon);
    const action = raw.slice(colon + 1).replace(/[_-]/g, '').toLowerCase();
    return entityCodesMatch(entity, 'Quotation') && action === actionNormalized;
  });
}

/** JWT trae `quotation:ViewAll`. No usa el rol Admin. */
export function userCanViewAllQuotations(
  user: { permissions?: unknown } | null | undefined,
): boolean {
  return jwtHasQuotationAction(user, 'viewall');
}

export function userCanViewAllQuotationBranches(
  user: { permissions?: unknown } | null | undefined,
): boolean {
  return jwtHasQuotationAction(user, 'viewallbranches');
}

/** Con ViewAll: filtro opcional. Sin él: siempre el propio usuario. */
export function resolveQuotationSellerScopeUserId(
  canViewAll: boolean,
  actorUserId: string,
  requestedSellerUserId?: string,
): string | null {
  if (!canViewAll) {
    if (requestedSellerUserId && requestedSellerUserId !== actorUserId) {
      throw new ForbiddenException(
        'No puedes filtrar cotizaciones de otros vendedores',
      );
    }
    return actorUserId;
  }

  const requested = requestedSellerUserId?.trim();
  return requested || null;
}

export function quotationIsVisibleToSeller(
  quotation: {
    seller_user_id?: string | null;
    assigned_seller_user_id?: string | null;
  },
  userId: string,
): boolean {
  return (
    quotation.seller_user_id === userId ||
    quotation.assigned_seller_user_id === userId
  );
}

export function assertQuotationSellerAccess(
  quotation: {
    id: string;
    seller_user_id?: string | null;
    assigned_seller_user_id?: string | null;
  },
  access?: QuotationSellerAccess,
): void {
  if (!access || access.canViewAll) {
    return;
  }
  if (quotationIsVisibleToSeller(quotation, access.userId)) {
    return;
  }
  throw new NotFoundException(`Cotización no encontrada: ${quotation.id}`);
}

export function quotationBillingBranchId(quotation: {
  billing_branch_id?: string | null;
  warehouse?: { billing_branch_id?: string | null } | null;
}): string | null {
  return quotation.billing_branch_id ?? quotation.warehouse?.billing_branch_id ?? null;
}

export function resolveQuotationBranchScopeIds(
  canViewAllBranches: boolean,
  assignedBranchIds: string[],
  requestedBranchId?: string,
): string[] | null {
  const requested = requestedBranchId?.trim();
  if (canViewAllBranches) {
    return requested ? [requested] : null;
  }
  if (requested) {
    if (!assignedBranchIds.includes(requested)) {
      throw new ForbiddenException(
        'No puedes filtrar cotizaciones de otras sucursales',
      );
    }
    return [requested];
  }
  return assignedBranchIds;
}

export function quotationIsVisibleToBranches(
  quotation: {
    billing_branch_id?: string | null;
    warehouse?: { billing_branch_id?: string | null } | null;
  },
  assignedBranchIds: string[],
): boolean {
  const branchId = quotationBillingBranchId(quotation);
  return Boolean(branchId && assignedBranchIds.includes(branchId));
}

export function assertQuotationBranchAccess(
  quotation: {
    id: string;
    billing_branch_id?: string | null;
    warehouse?: { billing_branch_id?: string | null } | null;
  },
  access?: QuotationSellerAccess,
): void {
  if (!access || access.canViewAllBranches) {
    return;
  }
  if (quotationIsVisibleToBranches(quotation, access.assignedBranchIds ?? [])) {
    return;
  }
  throw new NotFoundException(`Cotización no encontrada: ${quotation.id}`);
}
