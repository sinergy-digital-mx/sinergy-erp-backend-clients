import { Repository } from 'typeorm';
import { User } from '../entities/users/user.entity';

/** null = el usuario ve todas las sucursales. */
export async function callerBranchIds(
  userRepo: Repository<User>,
  tenantId: string,
  userId: string,
): Promise<string[] | null> {
  const rows: Array<{ billing_branch_id: string }> = await userRepo.query(
    `SELECT billing_branch_id
     FROM user_billing_branches
     WHERE tenant_id = ? AND user_id = ?`,
    [tenantId, userId],
  );
  const ids = [
    ...new Set(
      rows
        .map((row) => String(row.billing_branch_id ?? '').trim())
        .filter((id) => id.length > 0),
    ),
  ];
  if (ids.length) return ids;

  const user = await userRepo.findOne({
    where: { id: userId, tenant_id: tenantId },
    select: ['id', 'billing_branch_id'],
  });
  if (user?.billing_branch_id) return [user.billing_branch_id];
  return null;
}

/**
 * Cruza lo pedido con las sucursales del usuario.
 * null = sin filtro. [] = ninguna sucursal válida.
 */
export function narrowBranchIds(
  allowed: string[] | null,
  requested: string[],
): string[] | null {
  if (allowed == null) return requested.length ? requested : null;
  if (!requested.length) return allowed;
  const allowedSet = new Set(allowed);
  return requested.filter((id) => allowedSet.has(id));
}
