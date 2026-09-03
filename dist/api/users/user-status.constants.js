"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.USER_STATUS_CODE = void 0;
exports.normalizeUserStatusCode = normalizeUserStatusCode;
exports.isActiveUserStatus = isActiveUserStatus;
exports.USER_STATUS_CODE = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    DELETED: 'deleted',
};
function normalizeUserStatusCode(code) {
    return (code ?? '').trim().toLowerCase();
}
function isActiveUserStatus(code) {
    return normalizeUserStatusCode(code) === exports.USER_STATUS_CODE.ACTIVE;
}
//# sourceMappingURL=user-status.constants.js.map