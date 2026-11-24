"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POS_BRANCH_STOCK_PRODUCT_LIMIT = void 0;
exports.formatPosBranchStockQty = formatPosBranchStockQty;
exports.buildPosBranchStockProducts = buildPosBranchStockProducts;
exports.POS_BRANCH_STOCK_PRODUCT_LIMIT = 12;
function formatPosBranchStockQty(value) {
    const safe = Number.isFinite(value) ? value : 0;
    return safe.toFixed(3);
}
function buildPosBranchStockProducts(products, branches, rows) {
    const byProduct = new Map();
    for (const row of rows) {
        const productId = row.product_id?.trim();
        const branchId = row.billing_branch_id?.trim();
        if (!productId || !branchId) {
            continue;
        }
        let byBranch = byProduct.get(productId);
        if (!byBranch) {
            byBranch = new Map();
            byProduct.set(productId, byBranch);
        }
        const quantity = Number.isFinite(row.quantity) ? row.quantity : 0;
        const previous = byBranch.get(branchId);
        if (!previous) {
            byBranch.set(branchId, {
                product_id: productId,
                billing_branch_id: branchId,
                quantity,
                uom_name: row.uom_name?.trim() || null,
            });
            continue;
        }
        byBranch.set(branchId, {
            ...previous,
            quantity: previous.quantity + quantity,
            uom_name: previous.uom_name || row.uom_name?.trim() || null,
        });
    }
    return products.map((product) => {
        const byBranch = byProduct.get(product.id) ?? new Map();
        let total = 0;
        let uomName = '';
        let uomQty = -1;
        const cells = branches.map((branch) => {
            const row = byBranch.get(branch.id);
            const quantity = row?.quantity ?? 0;
            total += quantity;
            const name = row?.uom_name?.trim() || '';
            if (name && quantity >= uomQty) {
                uomName = name;
                uomQty = quantity;
            }
            return {
                billing_branch_id: branch.id,
                quantity: formatPosBranchStockQty(quantity),
                uom_name: name || null,
            };
        });
        return {
            product_id: product.id,
            sku: product.sku,
            name: product.name,
            uom_name: uomName || 'Pieza',
            total_quantity: formatPosBranchStockQty(total),
            branches: cells,
        };
    });
}
//# sourceMappingURL=pos-branch-stock.util.js.map