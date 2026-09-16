"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesOrderPosStage = void 0;
exports.isPosStageInCaja = isPosStageInCaja;
var SalesOrderPosStage;
(function (SalesOrderPosStage) {
    SalesOrderPosStage["Caja"] = "caja";
    SalesOrderPosStage["Ventas"] = "ventas";
})(SalesOrderPosStage || (exports.SalesOrderPosStage = SalesOrderPosStage = {}));
function isPosStageInCaja(stage) {
    return stage !== SalesOrderPosStage.Ventas;
}
//# sourceMappingURL=sales-order-pos-stage.enum.js.map