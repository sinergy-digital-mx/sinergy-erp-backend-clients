"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toPropertyLotLookup = toPropertyLotLookup;
const contract_currency_util_1 = require("../../contracts/contract-currency.util");
const property_pricing_util_1 = require("./property-pricing.util");
function toPropertyLotLookup(property) {
    const totalPrice = Number(property.total_price);
    const totalArea = Number(property.total_area);
    const storedUnit = property.price_per_m2 != null && property.price_per_m2 !== ''
        ? Number(property.price_per_m2)
        : null;
    return {
        id: property.id,
        code: property.code,
        name: property.name,
        block: property.block ?? null,
        lot_number: property.lot_number ?? null,
        status: property.status,
        total_area: Number.isFinite(totalArea) ? totalArea : 0,
        total_price: Number.isFinite(totalPrice) ? totalPrice : 0,
        price_per_m2: storedUnit != null && Number.isFinite(storedUnit)
            ? storedUnit
            : (0, property_pricing_util_1.derivePricePerM2)(totalPrice, totalArea),
        currency: (0, contract_currency_util_1.resolveStoredContractCurrency)(property.currency),
    };
}
//# sourceMappingURL=property-lot-lookup.util.js.map