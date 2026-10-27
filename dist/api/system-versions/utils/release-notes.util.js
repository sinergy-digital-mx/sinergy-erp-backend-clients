"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FALLBACK_RELEASE_MESSAGE = void 0;
exports.selectReleaseSubjects = selectReleaseSubjects;
exports.shouldIgnoreReleasePath = shouldIgnoreReleasePath;
exports.summarizeChangedPaths = summarizeChangedPaths;
exports.changesFromSubjects = changesFromSubjects;
exports.filterChangesForModules = filterChangesForModules;
exports.sanitizeReleaseChanges = sanitizeReleaseChanges;
exports.mergeReleaseChanges = mergeReleaseChanges;
exports.toSqlDateTime = toSqlDateTime;
exports.buildReleasePayload = buildReleasePayload;
exports.FALLBACK_RELEASE_MESSAGE = 'Actualización de la plataforma.';
const SKIP_SUBJECT = /^(deploying version\b|deploy backend build\b|deploy frontend\b|merge\b|merged\b)/i;
const AREA_RULES = [
    [/system-versions|app-update-dialog|app-update\.service|generate-app-version|build-with-version|push-deploy|deploy-both|record-system-version|release-notes/, 'Cambios en versiones'],
    [/whatsapp/, 'Cambios en WhatsApp'],
    [/electronic-invoic|advance-cfdi|finkok/, 'Cambios en facturación electrónica'],
    [/accounting|customer-debt|average-cost/, 'Cambios en contabilidad'],
    [/contract/, 'Cambios en contratos'],
    [/quotation/, 'Cambios en cotizaciones'],
    [/sales-order|pos-shift|pos\/|global-discount/, 'Cambios en ventas'],
    [/purchase-order/, 'Cambios en compras'],
    [/inventory|warehouse-control|madereria-inventory/, 'Cambios en inventario'],
    [/gps-tracking|shipping|\/trucks|logistics/, 'Cambios en logística'],
    [/employee/, 'Cambios en empleados'],
    [/exchange-rate/, 'Cambios en tipo de cambio'],
    [/customer/, 'Cambios en clientes'],
    [/billing|fiscal/, 'Cambios en facturación'],
    [/product/, 'Cambios en productos'],
    [/vendor/, 'Cambios en proveedores'],
    [/crm|\/leads/, 'Cambios en CRM'],
    [/\/auth\/|rbac|permission/, 'Cambios en accesos y permisos'],
    [/\/goals\/|sales-goals/, 'Cambios en metas'],
    [/mailer|email-template|\/email\//, 'Cambios en correo'],
    [/divino/, 'Cambios en Divino'],
    [/self-invoice/, 'Cambios en autofactura'],
    [/service-subscription/, 'Cambios en suscripciones'],
];
function selectReleaseSubjects(subjects, limit = 40) {
    const max = Number(limit) > 0 ? Number(limit) : 40;
    const selected = [];
    for (const raw of subjects ?? []) {
        const message = String(raw ?? '').replace(/\s+/g, ' ').trim();
        if (!message || SKIP_SUBJECT.test(message)) {
            continue;
        }
        selected.push(message.slice(0, 240));
        if (selected.length >= max) {
            break;
        }
    }
    return selected;
}
function shouldIgnoreReleasePath(filePath) {
    const normalized = filePath.replace(/\\/g, '/');
    return (normalized.startsWith('dist/') ||
        normalized.startsWith('node_modules/') ||
        normalized.startsWith('coverage/') ||
        normalized === 'package.json' ||
        normalized === 'package-lock.json' ||
        normalized.endsWith('releases.json') ||
        normalized.endsWith('releases.generated.ts') ||
        normalized.endsWith('app-version.json') ||
        normalized.endsWith('app-version.generated.ts') ||
        normalized.endsWith('.xlsx'));
}
function summarizeChangedPaths(filePaths, limit = 40) {
    const max = Number(limit) > 0 ? Number(limit) : 40;
    const messages = [];
    const seen = new Set();
    for (const filePath of filePaths ?? []) {
        if (!filePath || shouldIgnoreReleasePath(filePath)) {
            continue;
        }
        const normalized = filePath.replace(/\\/g, '/');
        const message = areaMessage(normalized);
        if (!message || seen.has(message)) {
            continue;
        }
        seen.add(message);
        messages.push(message);
        if (messages.length >= max) {
            break;
        }
    }
    return messages;
}
function areaMessage(filePath) {
    for (const [pattern, message] of AREA_RULES) {
        if (pattern.test(filePath)) {
            return message;
        }
    }
    const parts = filePath.split('/');
    const folder = folderFromPath(parts);
    if (!folder) {
        return null;
    }
    return `Cambios en ${folderLabel(folder)}`;
}
function folderFromPath(parts) {
    const apiIndex = parts.indexOf('api');
    if (apiIndex >= 0 && parts[apiIndex + 1]) {
        return parts[apiIndex + 1];
    }
    const featureIndex = parts.indexOf('features');
    if (featureIndex >= 0 && parts[featureIndex + 1]) {
        return parts[featureIndex + 1];
    }
    return null;
}
function folderLabel(folder) {
    const labels = {
        properties: 'inmuebles',
        users: 'usuarios',
        warehouse: 'almacenes',
        warehouses: 'almacenes',
        'uom-catalog': 'unidades de medida',
        categories: 'categorías',
        subcategories: 'subcategorías',
        catalogs: 'catálogos',
        payments: 'pagos',
        settings: 'configuración',
    };
    return labels[folder] || folder.replace(/-/g, ' ');
}
function changesFromSubjects(subjects, scope, limit = 40) {
    const safeScope = scope === 'backend' ? 'backend' : 'frontend';
    const selected = selectReleaseSubjects(subjects, limit);
    if (!selected.length) {
        return [{ scope: safeScope, message: exports.FALLBACK_RELEASE_MESSAGE }];
    }
    return selected.map((message) => ({ scope: safeScope, message }));
}
const RELEASE_MESSAGE_MODULES = {
    'cambios en versiones': ['system-versions'],
    'cambios en clientes': ['customers'],
    'cambios en empleados': ['employees', 'employee_portal'],
    'cambios en accesos y permisos': ['roles', 'users'],
    'cambios en configuración': ['settings'],
    'cambios en contabilidad': ['accounting'],
    'cambios en facturación': ['billing'],
    'cambios en contratos': ['contracts', 'contract_documents'],
    'cambios en crm': ['leads'],
    'cambios en divino': ['divino_dashboard', 'divino_reservation_formats'],
    'cambios en facturación electrónica': ['electronic_invoicing'],
    'cambios en tipo de cambio': ['exchange-rate'],
    'cambios en inventario': ['inventory', 'madereria_inventory_import'],
    'cambios en ventas': ['sales_orders', 'pos', 'pos-shifts', 'pos-configuration', 'global_discounts'],
    'cambios en productos': ['products', 'categories', 'subcategories'],
    'cambios en inmuebles': ['properties'],
    'cambios en compras': ['purchase_orders', 'purchase_order_real_cost'],
    'cambios en cotizaciones': ['quotations'],
    'cambios en autofactura': ['electronic_invoicing', 'sales_orders'],
    'cambios en logística': ['gps_tracking', 'shippings', 'trucks'],
    'cambios en unidades de medida': ['uom_catalog'],
    'cambios en usuarios': ['users'],
    'cambios en proveedores': ['vendors'],
    'cambios en almacenes': ['warehouses', 'warehouse_control'],
    'cambios en suscripciones': ['service_subscriptions'],
    'cambios en whatsapp': ['whatsapp'],
    'cambios en metas': ['goals'],
    'cambios en correo': ['mailer_configurations', 'email-templates', 'resend_configuration'],
    'cambios en pagos': ['payments'],
    'cambios en actividades': ['activities', 'customer_activities'],
    'cambios en categorías': ['categories'],
    'cambios en subcategorías': ['subcategories'],
    'cambios en reporte de ventas': ['zona_norte_custom_report', 'customer_sales_report'],
};
function filterChangesForModules(changes, enabledModuleCodes) {
    const enabled = new Set([...enabledModuleCodes]
        .map((code) => String(code ?? '').trim().toLowerCase())
        .filter(Boolean));
    return sanitizeReleaseChanges(changes).filter((change) => {
        if (change.message === exports.FALLBACK_RELEASE_MESSAGE) {
            return true;
        }
        const modules = RELEASE_MESSAGE_MODULES[change.message.toLowerCase()];
        if (!modules?.length) {
            return false;
        }
        return modules.some((code) => enabled.has(code));
    });
}
function sanitizeReleaseChanges(changes, limit = 80) {
    if (!Array.isArray(changes)) {
        return [];
    }
    const max = Number(limit) > 0 ? Number(limit) : 80;
    const sanitized = [];
    for (const item of changes) {
        if (!item || typeof item !== 'object') {
            continue;
        }
        const record = item;
        const message = String(record.message ?? '').replace(/\s+/g, ' ').trim();
        if (!message) {
            continue;
        }
        sanitized.push({
            scope: record.scope === 'backend' ? 'backend' : 'frontend',
            message: message.slice(0, 240),
        });
        if (sanitized.length >= max) {
            break;
        }
    }
    return sanitized;
}
function mergeReleaseChanges(groups) {
    const flat = sanitizeReleaseChanges((groups ?? []).flat(), 200);
    const real = flat.filter((item) => item.message !== exports.FALLBACK_RELEASE_MESSAGE);
    const source = real.length
        ? real
        : [{ scope: 'frontend', message: exports.FALLBACK_RELEASE_MESSAGE }];
    const unique = [];
    const seen = new Set();
    for (const item of source) {
        const key = item.message.toLowerCase();
        if (seen.has(key)) {
            continue;
        }
        seen.add(key);
        unique.push(item);
        if (unique.length >= 80) {
            break;
        }
    }
    return unique;
}
function toSqlDateTime(value) {
    const parsed = value ? new Date(value) : new Date();
    const date = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
    const pad = (part) => String(part).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
function buildReleasePayload(input) {
    const channel = input.channel === 'backend' || input.channel === 'full' ? input.channel : 'frontend';
    const version = String(input.version || '0.0.0').slice(0, 32);
    const buildId = input.buildId ? String(input.buildId).slice(0, 80) : null;
    const releasedAt = input.releasedAt || new Date().toISOString();
    const releaseKey = `${channel}:${version}:${buildId || releasedAt}`.slice(0, 160);
    return {
        releaseKey,
        version,
        buildId,
        channel,
        title: `Versión ${version}`,
        changes: mergeReleaseChanges([input.changes ?? []]),
        releasedAt,
    };
}
//# sourceMappingURL=release-notes.util.js.map