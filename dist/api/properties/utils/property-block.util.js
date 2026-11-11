"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPropertyBlocks = listPropertyBlocks;
function listPropertyBlocks(values) {
    const unique = new Set();
    for (const value of values) {
        const block = (value ?? '').trim();
        if (block)
            unique.add(block);
    }
    return [...unique].sort((a, b) => a.localeCompare(b, 'es', { numeric: true, sensitivity: 'base' }));
}
//# sourceMappingURL=property-block.util.js.map