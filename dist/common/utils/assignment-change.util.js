"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ASSIGNMENT_TYPE_LABELS = void 0;
exports.assignmentValue = assignmentValue;
exports.assignmentChange = assignmentChange;
exports.compactAssignmentChanges = compactAssignmentChanges;
exports.buildAssignmentDescription = buildAssignmentDescription;
exports.formatAssignmentUserLabel = formatAssignmentUserLabel;
exports.mapAssignmentActorName = mapAssignmentActorName;
const EMPTY_LABEL = 'Sin asignar';
function assignmentValue(value) {
    if (value === undefined || value === null || value === '') {
        return null;
    }
    return String(value);
}
function assignmentChange(field, fieldLabel, from, to, fromId, toId) {
    const previous = assignmentValue(from);
    const next = assignmentValue(to);
    if (previous === next && (fromId ?? null) === (toId ?? null)) {
        return null;
    }
    return {
        field,
        field_label: fieldLabel,
        from: previous,
        to: next,
        from_id: fromId ?? null,
        to_id: toId ?? null,
    };
}
function compactAssignmentChanges(changes) {
    return changes.filter((change) => change !== null);
}
function buildAssignmentDescription(changes) {
    return changes
        .map((change) => `${change.field_label}: ${change.from ?? EMPTY_LABEL} → ${change.to ?? EMPTY_LABEL}`)
        .join('; ');
}
function formatAssignmentUserLabel(user) {
    if (!user)
        return null;
    const name = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
    const withCode = name && user.pos_user_code != null ? `${name} (${user.pos_user_code})` : name;
    return withCode || user.email || null;
}
function mapAssignmentActorName(actor) {
    if (!actor)
        return null;
    const name = [actor.first_name, actor.last_name].filter(Boolean).join(' ').trim();
    return name || actor.email || null;
}
exports.ASSIGNMENT_TYPE_LABELS = {
    assignment_initialized: 'Asignación inicial',
    assignment_updated: 'Cambio de asignación',
};
//# sourceMappingURL=assignment-change.util.js.map