"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POS_COLLECT_TYPES = exports.POS_SELL_TYPES = exports.PosUserType = void 0;
exports.canPosSell = canPosSell;
exports.canPosCollect = canPosCollect;
exports.canCoverPosCaja = canCoverPosCaja;
var PosUserType;
(function (PosUserType) {
    PosUserType["VENTAS"] = "VENTAS";
    PosUserType["COBRANZA"] = "COBRANZA";
    PosUserType["AMBOS"] = "AMBOS";
})(PosUserType || (exports.PosUserType = PosUserType = {}));
exports.POS_SELL_TYPES = [
    PosUserType.VENTAS,
    PosUserType.AMBOS,
];
exports.POS_COLLECT_TYPES = [
    PosUserType.COBRANZA,
    PosUserType.AMBOS,
];
function canPosSell(type) {
    return type === PosUserType.VENTAS || type === PosUserType.AMBOS;
}
function canPosCollect(type) {
    return type === PosUserType.COBRANZA || type === PosUserType.AMBOS;
}
function canCoverPosCaja(user) {
    const isPosTerminal = user.is_pos_user === true || user.is_pos_user === 1;
    if (!isPosTerminal) {
        return true;
    }
    return canPosSell(user.pos_user_type) || canPosCollect(user.pos_user_type);
}
//# sourceMappingURL=pos-user-type.enum.js.map