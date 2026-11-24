const { execSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const FALLBACK_RELEASE_MESSAGE = 'Actualización de la plataforma.';

const RELEASE_MODULES = {
  customers: { label: 'Clientes', codes: ['customers'] },
  crm: { label: 'CRM', codes: ['leads'] },
  'purchase-orders': { label: 'Órdenes de compra', codes: ['purchase_orders', 'purchase_order_real_cost'] },
  vendors: { label: 'Proveedores', codes: ['vendors'] },
  'sales-orders': { label: 'Órdenes de venta', codes: ['sales_orders'] },
  sales: { label: 'Ventas', codes: ['sales_orders', 'pos', 'pos-shifts', 'pos-configuration', 'global_discounts'] },
  quotations: { label: 'Cotizaciones', codes: ['quotations'] },
  logistics: { label: 'Logística', codes: ['gps_tracking', 'shippings', 'trucks'] },
  products: { label: 'Productos', codes: ['products', 'categories', 'subcategories', 'price_updates'] },
  inventory: { label: 'Inventario', codes: ['inventory', 'madereria_inventory_import'] },
  pos: { label: 'POS Ventas', codes: ['pos', 'pos-shifts', 'pos-configuration'] },
  'pos-cash': { label: 'POS Caja', codes: ['pos', 'pos-shifts', 'pos-configuration'] },
  accounting: { label: 'Contabilidad', codes: ['accounting'] },
  billing: { label: 'Facturación', codes: ['billing', 'electronic_invoicing'] },
  employees: { label: 'Empleados', codes: ['employees', 'employee_portal'] },
  contracts: { label: 'Contratos', codes: ['contracts', 'contract_documents'] },
  whatsapp: { label: 'WhatsApp', codes: ['whatsapp'] },
  settings: { label: 'Configuración', codes: ['settings', 'system-versions'] },
  platform: { label: 'Plataforma', codes: [] },
};

const PREFIX_RULES = [
  [/^pos caja\b/i, 'pos-cash'],
  [/^pos ventas\b/i, 'pos'],
  [/^inventario\b/i, 'inventory'],
  [/^órdenes de venta\b|^ordenes de venta\b/i, 'sales-orders'],
  [/^órdenes de compra\b|^ordenes de compra\b/i, 'purchase-orders'],
  [/^cotizaciones\b/i, 'quotations'],
  [/^cobranza\b/i, 'accounting'],
  [/^expediente de empleado\b|^empleados?\b/i, 'employees'],
  [/^clientes\b/i, 'customers'],
  [/^facturaci[oó]n\b/i, 'billing'],
  [/^whatsapp\b/i, 'whatsapp'],
  [/^contratos?\b/i, 'contracts'],
  [/^productos\b/i, 'products'],
  [/^proveedores\b/i, 'vendors'],
  [/^log[ií]stica\b/i, 'logistics'],
  [/^crm\b/i, 'crm'],
  [/^configuraci[oó]n\b/i, 'settings'],
];

const KEYWORD_RULES = [
  [/m[aá]scara de color|logo del men[uú]|degradado del men[uú]|\blogo\b|\btemplate\b/i, 'settings'],
  [/pos caja|ventas en caja/i, 'pos-cash'],
  [/carrito de pos|descuento de precio en el carrito/i, 'pos'],
  [/órdenes de venta|ordenes de venta|detalle de la orden/i, 'sales-orders'],
  [/órdenes de compra|ordenes de compra/i, 'purchase-orders'],
  [/cotizaci[oó]n/i, 'quotations'],
  [/inventario/i, 'inventory'],
  [/empleado/i, 'employees'],
  [/carta porte|chofer|cami[oó]n|\benv[ií]o\b/i, 'logistics'],
  [/informaci[oó]n fiscal del cliente|editar cliente|\bclientes?\b|\brfc\b/i, 'customers'],
  [/whatsapp/i, 'whatsapp'],
  [/contrato/i, 'contracts'],
  [/\bproducto/i, 'products'],
  [/proveedor/i, 'vendors'],
  [/\bcrm\b|\bleads?\b/i, 'crm'],
  [/factur|cfdi|timbrar/i, 'billing'],
  [/contabil|cobranza/i, 'accounting'],
];
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

  for (const raw of subjects || []) {
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
  const normalized = String(filePath || '').replace(/\\/g, '/');
  return (
    normalized.startsWith('dist/') ||
    normalized.startsWith('node_modules/') ||
    normalized.startsWith('coverage/') ||
    normalized === 'package.json' ||
    normalized === 'package-lock.json' ||
    normalized.endsWith('releases.json') ||
    normalized.endsWith('releases.generated.ts') ||
    normalized.endsWith('app-version.json') ||
    normalized.endsWith('app-version.generated.ts') ||
    normalized.endsWith('.xlsx')
  );
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

function summarizeChangedPaths(filePaths, limit = 40) {
  const max = Number(limit) > 0 ? Number(limit) : 40;
  const messages = [];
  const seen = new Set();

  for (const filePath of filePaths || []) {
    if (!filePath || shouldIgnoreReleasePath(filePath)) {
      continue;
    }
    const message = areaMessage(String(filePath).replace(/\\/g, '/'));
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

function changesFromSubjects(subjects, scope, limit = 40) {
  const safeScope = scope === 'backend' ? 'backend' : 'frontend';
  const selected = selectReleaseSubjects(subjects, limit);
  if (!selected.length) {
    return [{ scope: safeScope, message: FALLBACK_RELEASE_MESSAGE }];
  }
  return selected.map((message) => ({ scope: safeScope, message }));
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
    const message = String(item.message ?? '').replace(/\s+/g, ' ').trim();
    if (!message) {
      continue;
    }
    const change = {
      scope: item.scope === 'backend' ? 'backend' : 'frontend',
      message: message.slice(0, 240),
    };
    const moduleCode = normalizeModuleCode(item.module);
    if (moduleCode) {
      change.module = moduleCode;
      change.moduleLabel = moduleLabel(moduleCode);
    }
    sanitized.push(change);
    if (sanitized.length >= max) {
      break;
    }
  }

  return sanitized;
}

function mergeReleaseChanges(groups) {
  const flat = sanitizeReleaseChanges((groups || []).flat(), 200);
  const real = flat.filter((item) => item.message !== FALLBACK_RELEASE_MESSAGE);
  const source = real.length ? real : [{ scope: 'frontend', message: FALLBACK_RELEASE_MESSAGE }];
  const unique = [];
  const seen = new Set();

  for (const item of source) {
    const key = `${item.module || ''}|${item.message.toLowerCase()}`;
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
    changes: mergeReleaseChanges([input.changes || []]),
    releasedAt,
  };
}

function git(repoDir, command) {
  return execSync(command, {
    cwd: repoDir,
    encoding: 'utf8',
    shell: true,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function collectSubjects(repoDir) {
  let log = '';
  try {
    log = git(repoDir, 'git log -n 120 --no-merges --pretty=%s');
  } catch {
    return [];
  }

  const sinceLastDeploy = [];
  for (const line of log ? log.split(/\r?\n/) : []) {
    const subject = line.trim();
    if (!subject) {
      continue;
    }
    if (SKIP_SUBJECT.test(subject)) {
      break;
    }
    sinceLastDeploy.push(subject);
  }
  return sinceLastDeploy;
}

function listChangedPaths(repoDir) {
  const paths = [];
  for (const command of ['git diff --name-only HEAD', 'git ls-files --others --exclude-standard']) {
    try {
      const output = git(repoDir, command);
      if (output) {
        paths.push(...output.split(/\r?\n/));
      }
    } catch {
      // El repo puede no tener cambios.
    }
  }
  return paths.map((item) => item.trim()).filter(Boolean);
}

function snapshotPath(repoDir) {
  return path.join(repoDir, 'scripts', '.release-fingerprint.json');
}

function readReleaseSnapshot(repoDir) {
  const file = snapshotPath(repoDir);
  if (!fs.existsSync(file)) {
    return {};
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function snapshotChangedPaths(repoDir) {
  const snapshot = {};
  for (const filePath of listChangedPaths(repoDir)) {
    if (shouldIgnoreReleasePath(filePath)) {
      continue;
    }
    const normalized = filePath.replace(/\\/g, '/');
    const absolute = path.join(repoDir, normalized);
    try {
      const content = fs.readFileSync(absolute);
      snapshot[normalized] = crypto.createHash('sha1').update(content).digest('hex');
    } catch {
      snapshot[normalized] = 'missing';
    }
  }
  return snapshot;
}

function writeReleaseSnapshot(repoDir) {
  const file = snapshotPath(repoDir);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(snapshotChangedPaths(repoDir), null, 2)}\n`);
}

function freshChangedPaths(repoDir) {
  const previous = readReleaseSnapshot(repoDir);
  const current = snapshotChangedPaths(repoDir);
  return Object.keys(current).filter((filePath) => previous[filePath] !== current[filePath]);
}

function collectChanges(repoDir, scope) {
  const safeScope = scope === 'backend' ? 'backend' : 'frontend';
  const messages = [];
  const seen = new Set();

  for (const message of [
    ...selectReleaseSubjects(collectSubjects(repoDir)),
    ...summarizeChangedPaths(freshChangedPaths(repoDir)),
  ]) {
    const key = message.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    messages.push(message);
    if (messages.length >= 40) {
      break;
    }
  }

  if (!messages.length) {
    return [{ scope: safeScope, message: FALLBACK_RELEASE_MESSAGE }];
  }

  return messages.map((message) => ({ scope: safeScope, message }));
}

function normalizeModuleCode(value) {
  const code = String(value || '').trim().toLowerCase();
  if (!code || !Object.prototype.hasOwnProperty.call(RELEASE_MODULES, code)) {
    return null;
  }
  return code;
}

function moduleLabel(moduleCode) {
  if (!moduleCode) return null;
  return RELEASE_MODULES[moduleCode]?.label || null;
}

function inferModule(message) {
  const text = String(message || '').trim();
  for (const [pattern, code] of PREFIX_RULES) {
    if (pattern.test(text)) return code;
  }
  for (const [pattern, code] of KEYWORD_RULES) {
    if (pattern.test(text)) return code;
  }
  return 'platform';
}

function stripLeadingModuleLabel(message, moduleCode) {
  const label = moduleLabel(moduleCode);
  if (!label) return message;
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const stripped = message.replace(new RegExp(`^${escaped}\\s*[:\\-—]\\s*`, 'i'), '').trim();
  if (!stripped) return message;
  return stripped.charAt(0).toUpperCase() + stripped.slice(1);
}

function changesFromChangelogEntries(entries) {
  const changes = [];
  for (const entry of entries || []) {
    const message = String(entry?.message || '').replace(/\s+/g, ' ').trim();
    if (!message) continue;
    const moduleCode = normalizeModuleCode(entry?.module) || inferModule(message);
    changes.push({
      scope: entry?.scope === 'backend' ? 'backend' : 'frontend',
      module: moduleCode,
      message: stripLeadingModuleLabel(message, moduleCode).slice(0, 240),
    });
  }
  return mergeReleaseChanges([changes]);
}

function applyChangelogToReleases(releases, entries) {
  const byVersion = new Map();
  for (const entry of entries || []) {
    if (entry?.status !== 'shipped') continue;
    const version = String(entry?.version || '');
    if (!version) continue;
    if (!byVersion.has(version)) byVersion.set(version, []);
    byVersion.get(version).push(entry);
  }

  return (releases || []).map((release) => {
    const notes = byVersion.get(String(release?.version || ''));
    if (!notes?.length) return release;
    return {
      ...release,
      changes: changesFromChangelogEntries(notes),
    };
  });
}

module.exports = {
  FALLBACK_RELEASE_MESSAGE,
  selectReleaseSubjects,
  summarizeChangedPaths,
  changesFromSubjects,
  sanitizeReleaseChanges,
  mergeReleaseChanges,
  toSqlDateTime,
  buildReleasePayload,
  collectSubjects,
  collectChanges,
  writeReleaseSnapshot,
  RELEASE_MODULES,
  normalizeModuleCode,
  moduleLabel,
  inferModule,
  stripLeadingModuleLabel,
  changesFromChangelogEntries,
  applyChangelogToReleases,
};
