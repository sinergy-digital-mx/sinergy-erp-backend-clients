"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatUserDisplayName = formatUserDisplayName;
function formatUserDisplayName(user) {
    if (!user) {
        return null;
    }
    const name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    return name || null;
}
//# sourceMappingURL=user-display-name.util.js.map