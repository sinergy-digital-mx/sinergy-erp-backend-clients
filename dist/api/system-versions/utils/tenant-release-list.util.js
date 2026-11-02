"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listReleasesForTenant = listReleasesForTenant;
exports.paginateTenantReleases = paginateTenantReleases;
const release_notes_util_1 = require("./release-notes.util");
function listReleasesForTenant(releases, enabledModuleCodes) {
    const enabled = enabledModuleCodes;
    return [...(releases ?? [])]
        .map((release) => ({
        id: String(release.releaseKey || ''),
        version: String(release.version || ''),
        build_id: release.buildId ? String(release.buildId) : null,
        channel: release.channel,
        title: String(release.title || `Versión ${release.version || ''}`),
        changes: (0, release_notes_util_1.filterChangesForModules)(release.changes, enabled),
        released_at: String(release.releasedAt || ''),
    }))
        .filter((item) => item.id && item.changes.length > 0)
        .sort((left, right) => {
        const byDate = right.released_at.localeCompare(left.released_at);
        if (byDate !== 0) {
            return byDate;
        }
        return right.id.localeCompare(left.id);
    });
}
function paginateTenantReleases(items, pageInput, limitInput, search) {
    let page = Number(pageInput) || 1;
    let limit = Number(limitInput) || 20;
    if (page < 1)
        page = 1;
    if (limit < 1)
        limit = 1;
    if (limit > 200)
        limit = 200;
    const term = String(search ?? '').trim().toLowerCase();
    const filtered = term
        ? items.filter((item) => item.version.toLowerCase().includes(term)
            || item.title.toLowerCase().includes(term)
            || item.changes.some((change) => change.message.toLowerCase().includes(term)))
        : items;
    const total = filtered.length;
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
    const data = filtered.slice((page - 1) * limit, page * limit);
    return {
        data,
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1 && totalPages > 0,
    };
}
//# sourceMappingURL=tenant-release-list.util.js.map