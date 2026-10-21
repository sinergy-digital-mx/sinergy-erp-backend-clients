"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lineConceptName = lineConceptName;
function lineConceptName(line, fallback = 'Producto') {
    const custom = line.custom_description?.trim();
    if (custom)
        return custom;
    return line.product?.name?.trim() || fallback;
}
//# sourceMappingURL=sales-order-line-name.util.js.map