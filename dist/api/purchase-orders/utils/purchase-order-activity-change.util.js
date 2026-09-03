"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activityValue = activityValue;
exports.activityChange = activityChange;
exports.compactActivityChanges = compactActivityChanges;
function activityValue(value) {
    if (value === undefined || value === null || value === '') {
        return null;
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value);
    }
    return String(value);
}
function activityChange(field, fieldLabel, from, to) {
    const previous = activityValue(from);
    const next = activityValue(to);
    if (previous === next) {
        return null;
    }
    return { field, field_label: fieldLabel, from: previous, to: next };
}
function compactActivityChanges(changes) {
    return changes.filter((change) => change !== null);
}
//# sourceMappingURL=purchase-order-activity-change.util.js.map