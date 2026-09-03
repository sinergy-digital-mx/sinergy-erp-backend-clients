"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeProductSearchText = normalizeProductSearchText;
exports.parseProductSearchTokens = parseProductSearchTokens;
exports.getProductSearchQuery = getProductSearchQuery;
exports.productSearchOrderParams = productSearchOrderParams;
exports.applyProductSearchFilter = applyProductSearchFilter;
exports.applyProductSearchOrder = applyProductSearchOrder;
exports.buildProductSearchRankSql = buildProductSearchRankSql;
exports.compareProductSearchRelevance = compareProductSearchRelevance;
exports.getProductSearchRank = getProductSearchRank;
const PRODUCT_SEARCH_TIER = {
    SKU_EXACT: 0,
    EXTERNAL_SKU_EXACT: 1,
    SKU_PREFIX: 2,
    EXTERNAL_SKU_PREFIX: 3,
    SKU_CONTAINS: 4,
    EXTERNAL_SKU_CONTAINS: 5,
    NAME_PREFIX: 6,
    NAME_WORD: 7,
    NAME_CONTAINS: 8,
    TOKEN_FALLBACK: 9,
};
function normalizeProductSearchText(value) {
    if (!value)
        return '';
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ');
}
function parseProductSearchTokens(search) {
    const normalized = sanitizeSearchToken(normalizeProductSearchText(search));
    if (!normalized)
        return [];
    return normalized.split(' ').filter(Boolean);
}
function getProductSearchQuery(search) {
    return parseProductSearchTokens(search).join(' ');
}
function productSearchOrderParams(query) {
    return {
        productSearchExact: query,
        productSearchPrefix: `${query}%`,
        productSearchContains: `%${query}%`,
        productSearchWord: `% ${query}%`,
    };
}
function applyProductSearchFilter(qb, search, alias = 'product') {
    const tokens = parseProductSearchTokens(search);
    if (tokens.length === 0)
        return;
    tokens.forEach((token, index) => {
        const param = `productSearchToken${index}`;
        qb.andWhere(`(${alias}.sku LIKE :${param} OR ${alias}.external_sku LIKE :${param} OR ${alias}.name LIKE :${param})`, { [param]: `%${token}%` });
    });
}
function applyProductSearchOrder(qb, search, grouped = true) {
    const query = getProductSearchQuery(search);
    if (!query)
        return false;
    qb.addSelect(buildProductSearchRankSql(grouped), 'search_rank')
        .orderBy('search_rank', 'ASC')
        .addOrderBy(grouped ? 'MAX(product.name)' : 'product.name', 'ASC');
    const params = productSearchOrderParams(query);
    for (const [key, value] of Object.entries(params)) {
        qb.setParameter(key, value);
    }
    return true;
}
function buildProductSearchRankSql(grouped = true) {
    const sku = grouped ? 'MAX(product.sku)' : 'product.sku';
    const externalSku = grouped ? 'MAX(product.external_sku)' : 'product.external_sku';
    const name = grouped ? 'MAX(product.name)' : 'product.name';
    return `CASE
    WHEN ${sku} = :productSearchExact THEN 0
    WHEN ${externalSku} = :productSearchExact THEN 1
    WHEN ${sku} LIKE :productSearchPrefix THEN 2
    WHEN ${externalSku} LIKE :productSearchPrefix THEN 3
    WHEN ${sku} LIKE :productSearchContains THEN 4
    WHEN ${externalSku} LIKE :productSearchContains THEN 5
    WHEN ${name} LIKE :productSearchPrefix THEN 6
    WHEN ${name} LIKE :productSearchWord THEN 7
    ELSE 8
  END`;
}
function compareProductSearchRelevance(a, b, search) {
    const rankA = getProductSearchRank(a, search);
    const rankB = getProductSearchRank(b, search);
    if (rankA.tier !== rankB.tier)
        return rankA.tier - rankB.tier;
    if (rankA.position !== rankB.position)
        return rankA.position - rankB.position;
    if (rankA.length !== rankB.length)
        return rankA.length - rankB.length;
    return rankA.name.localeCompare(rankB.name, 'es');
}
function getProductSearchRank(product, search) {
    const query = normalizeProductSearchText(search);
    const sku = normalizeProductSearchText(product.sku);
    const externalSku = normalizeProductSearchText(product.external_sku);
    const name = normalizeProductSearchText(product.name);
    if (!query) {
        return { tier: 99, position: 0, length: name.length, name };
    }
    if (sku === query) {
        return { tier: PRODUCT_SEARCH_TIER.SKU_EXACT, position: 0, length: sku.length, name };
    }
    if (externalSku === query) {
        return {
            tier: PRODUCT_SEARCH_TIER.EXTERNAL_SKU_EXACT,
            position: 0,
            length: externalSku.length,
            name,
        };
    }
    if (sku.startsWith(query)) {
        return { tier: PRODUCT_SEARCH_TIER.SKU_PREFIX, position: 0, length: sku.length, name };
    }
    if (externalSku.startsWith(query)) {
        return {
            tier: PRODUCT_SEARCH_TIER.EXTERNAL_SKU_PREFIX,
            position: 0,
            length: externalSku.length,
            name,
        };
    }
    const skuIndex = sku.indexOf(query);
    if (skuIndex >= 0) {
        return {
            tier: PRODUCT_SEARCH_TIER.SKU_CONTAINS,
            position: skuIndex,
            length: sku.length,
            name,
        };
    }
    const externalIndex = externalSku.indexOf(query);
    if (externalIndex >= 0) {
        return {
            tier: PRODUCT_SEARCH_TIER.EXTERNAL_SKU_CONTAINS,
            position: externalIndex,
            length: externalSku.length,
            name,
        };
    }
    if (name.startsWith(query)) {
        return { tier: PRODUCT_SEARCH_TIER.NAME_PREFIX, position: 0, length: name.length, name };
    }
    const nameIndex = name.indexOf(query);
    if (nameIndex >= 0) {
        return {
            tier: isWordStart(name, nameIndex)
                ? PRODUCT_SEARCH_TIER.NAME_WORD
                : PRODUCT_SEARCH_TIER.NAME_CONTAINS,
            position: nameIndex,
            length: name.length,
            name,
        };
    }
    return {
        tier: PRODUCT_SEARCH_TIER.TOKEN_FALLBACK,
        position: earliestTokenPosition(name, query),
        length: name.length,
        name,
    };
}
function sanitizeSearchToken(value) {
    return value.replace(/[%_\\]/g, ' ').replace(/\s+/g, ' ').trim();
}
function isWordStart(haystack, index) {
    if (index <= 0)
        return true;
    return /[\s\-_/.,;:+]/.test(haystack.charAt(index - 1));
}
function earliestTokenPosition(name, query) {
    const tokens = query.split(' ').filter(Boolean);
    let best = Number.MAX_SAFE_INTEGER;
    for (const token of tokens) {
        const index = name.indexOf(token);
        if (index >= 0)
            best = Math.min(best, index);
    }
    return best;
}
//# sourceMappingURL=product-search-rank.util.js.map