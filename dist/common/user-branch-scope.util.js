"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.callerBranchIds = callerBranchIds;
exports.narrowBranchIds = narrowBranchIds;
async function callerBranchIds(userRepo, tenantId, userId) {
    const rows = await userRepo.query(`SELECT billing_branch_id
     FROM user_billing_branches
     WHERE tenant_id = ? AND user_id = ?`, [tenantId, userId]);
    const ids = [
        ...new Set(rows
            .map((row) => String(row.billing_branch_id ?? '').trim())
            .filter((id) => id.length > 0)),
    ];
    if (ids.length)
        return ids;
    const user = await userRepo.findOne({
        where: { id: userId, tenant_id: tenantId },
        select: ['id', 'billing_branch_id'],
    });
    if (user?.billing_branch_id)
        return [user.billing_branch_id];
    return null;
}
function narrowBranchIds(allowed, requested) {
    if (allowed == null)
        return requested.length ? requested : null;
    if (!requested.length)
        return allowed;
    const allowedSet = new Set(allowed);
    return requested.filter((id) => allowedSet.has(id));
}
//# sourceMappingURL=user-branch-scope.util.js.map