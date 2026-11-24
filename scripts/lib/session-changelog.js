const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { inferModule, moduleLabel, normalizeModuleCode, stripLeadingModuleLabel } = require('./release-notes');

const CHANGELOG_JSON = 'scripts/changelog.json';
const CHANGELOG_MD = 'scripts/CHANGELOG.md';

function changelogPaths(repoDir) {
  return {
    json: path.join(repoDir, CHANGELOG_JSON),
    md: path.join(repoDir, CHANGELOG_MD),
  };
}

function localStamp(date) {
  const pad = (part) => String(part).padStart(2, '0');
  const tzMinutes = -date.getTimezoneOffset();
  const sign = tzMinutes >= 0 ? '+' : '-';
  const abs = Math.abs(tzMinutes);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

function dayOf(value) {
  const match = String(value || '').match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : '';
}

function normalizeScope(scope) {
  if (scope === 'frontend' || scope === 'backend' || scope === 'both') {
    return scope;
  }
  throw new Error('scope debe ser frontend, backend o both');
}

function scopeLabel(scope) {
  if (scope === 'backend') return 'servidor';
  if (scope === 'both') return 'aplicación y servidor';
  return 'aplicación';
}

function normalizeEntry(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const message = String(raw.message ?? '').replace(/\s+/g, ' ').trim().slice(0, 240);
  if (!message) return null;
  let scope = 'frontend';
  if (raw.scope === 'backend' || raw.scope === 'both' || raw.scope === 'frontend') {
    scope = raw.scope;
  }
  const entry = {
    id: String(raw.id || message).slice(0, 80),
    at: String(raw.at || ''),
    scope,
    message,
    status: raw.status === 'shipped' ? 'shipped' : 'pending',
    version: raw.version ? String(raw.version).slice(0, 32) : null,
    shippedAt: raw.shippedAt ? String(raw.shippedAt) : null,
  };
  const moduleCode = normalizeModuleCode(raw.module);
  if (moduleCode) entry.module = moduleCode;
  return entry;
}

function readChangelog(repoDir) {
  const file = changelogPaths(repoDir).json;
  if (!fs.existsSync(file)) {
    return { entries: [] };
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    const entries = Array.isArray(parsed?.entries)
      ? parsed.entries.map(normalizeEntry).filter(Boolean)
      : [];
    return { entries };
  } catch {
    return { entries: [] };
  }
}

const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

function monthKey(value) {
  const day = dayOf(value);
  return day ? day.slice(0, 7) : 'sin-fecha';
}

function monthTitle(key) {
  const match = String(key || '').match(/^(\d{4})-(\d{2})$/);
  if (!match) return 'Sin fecha';
  const name = MONTHS[Number(match[2]) - 1];
  if (!name) return 'Sin fecha';
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${match[1]}`;
}

function shortDay(value) {
  const day = dayOf(value);
  const match = day.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return '';
  const name = MONTHS[Number(match[2]) - 1];
  if (!name) return '';
  return `${Number(match[3])} ${name.slice(0, 3)}`;
}

function readingLine(entry) {
  const code = entry?.module || inferModule(entry?.message);
  const label = moduleLabel(code);
  if (!label || (!entry?.module && code === 'platform')) {
    return `${scopeLabel(entry.scope)} · ${entry.message}`;
  }
  return `${label} · ${stripLeadingModuleLabel(entry.message, code)}`;
}

function renderMarkdown(log) {
  const entries = Array.isArray(log?.entries) ? log.entries : [];
  const pending = entries.filter((entry) => entry.status !== 'shipped');
  const shipped = entries.filter((entry) => entry.status === 'shipped');
  const lines = [
    '# Changelog de solicitudes',
    '',
    'Lectura de `scripts/changelog.json`. No editar a mano.',
    '',
    'Cada solicitud terminada entra en **Pendientes**. `npm run deploy:both` publica esas notas en la versión y las pasa a **Enviados**.',
    '',
    '## Pendientes',
    '',
  ];

  if (!pending.length) {
    lines.push('No hay solicitudes pendientes de deploy.', '');
  } else {
    lines.push(...renderMonthBuckets([...pending].reverse(), (entry) => entry.at, (entry) => {
      const day = shortDay(entry.at);
      return `- ${day ? `**${day}** · ` : ''}${readingLine(entry)}`;
    }));
  }

  lines.push('## Enviados', '');
  if (!shipped.length) {
    lines.push('Todavía no hay un deploy con este registro.', '');
  } else {
    const versions = new Map();
    const versionOrder = [];
    for (const entry of shipped) {
      const key = entry.version || 'sin versión';
      if (!versions.has(key)) {
        versions.set(key, []);
        versionOrder.push(key);
      }
      versions.get(key).push(entry);
    }
    const blocks = versionOrder.reverse().map((version) => {
      const group = versions.get(version);
      const stamp = group[0].shippedAt || group[0].at;
      const day = shortDay(stamp);
      return {
        month: monthKey(stamp),
        heading: `#### Versión ${version}${day ? ` · ${day}` : ''}`,
        lines: group.map((entry) => `- ${readingLine(entry)}`),
      };
    });
    lines.push(...renderBlocksByMonth(blocks));
  }

  return `${lines.join('\n').replace(/\n+$/, '')}\n`;
}

function renderMonthBuckets(entries, stampOf, lineOf) {
  const buckets = new Map();
  const order = [];
  for (const entry of entries) {
    const key = monthKey(stampOf(entry));
    if (!buckets.has(key)) {
      buckets.set(key, []);
      order.push(key);
    }
    buckets.get(key).push(lineOf(entry));
  }
  const lines = [];
  for (const key of order) {
    lines.push(`### ${monthTitle(key)}`, '');
    lines.push(...buckets.get(key), '');
  }
  return lines;
}

function renderBlocksByMonth(blocks) {
  const buckets = new Map();
  const order = [];
  for (const block of blocks) {
    if (!buckets.has(block.month)) {
      buckets.set(block.month, []);
      order.push(block.month);
    }
    buckets.get(block.month).push(block);
  }
  const lines = [];
  for (const key of order) {
    lines.push(`### ${monthTitle(key)}`, '');
    for (const block of buckets.get(key)) {
      lines.push(block.heading, '', ...block.lines, '');
    }
  }
  return lines;
}

function writeChangelog(repoDir, log) {
  const paths = changelogPaths(repoDir);
  fs.mkdirSync(path.dirname(paths.json), { recursive: true });
  const entries = (log?.entries || []).map(normalizeEntry).filter(Boolean);
  const payload = { entries };
  fs.writeFileSync(paths.json, `${JSON.stringify(payload, null, 2)}\n`);
  fs.writeFileSync(paths.md, renderMarkdown(payload));
  return payload;
}

function nextId(entries, date) {
  const pad = (part) => String(part).padStart(2, '0');
  const base = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  const used = new Set(entries.map((entry) => entry.id));
  let id = base;
  let seq = 2;
  while (used.has(id)) {
    id = `${base}-${seq}`;
    seq += 1;
  }
  return id;
}

function appendEntry(repoDir, input) {
  const scope = normalizeScope(input?.scope);
  const message = String(input?.message ?? '').replace(/\s+/g, ' ').trim().slice(0, 240);
  if (!message) {
    throw new Error('Falta el mensaje del changelog');
  }
  let moduleCode = null;
  if (input?.module) {
    moduleCode = normalizeModuleCode(input.module);
    if (!moduleCode) {
      throw new Error('module no es válido');
    }
  }
  const data = readChangelog(repoDir);
  const exists = data.entries.some(
    (entry) => entry.status === 'pending' && entry.message.toLowerCase() === message.toLowerCase(),
  );
  if (exists) {
    return data;
  }
  const now = new Date();
  const entry = {
    id: nextId(data.entries, now),
    at: localStamp(now),
    scope,
    message,
    status: 'pending',
    version: null,
    shippedAt: null,
  };
  if (moduleCode) entry.module = moduleCode;
  data.entries.push(entry);
  return writeChangelog(repoDir, data);
}

function pendingEntries(repoDir) {
  return readChangelog(repoDir).entries.filter((entry) => entry.status === 'pending');
}

function markPendingShipped(repoDir, input) {
  const version = String(input?.version || '').slice(0, 32);
  const releasedAt = input?.releasedAt || localStamp(new Date());
  const data = readChangelog(repoDir);
  const shipped = [];
  for (const entry of data.entries) {
    if (entry.status !== 'pending') continue;
    entry.status = 'shipped';
    entry.version = version || null;
    entry.shippedAt = releasedAt;
    shipped.push({ ...entry });
  }
  if (!shipped.length) return [];
  writeChangelog(repoDir, data);
  return shipped;
}

function restorePending(repoDir, ids) {
  const wanted = new Set(ids || []);
  if (!wanted.size) return readChangelog(repoDir);
  const data = readChangelog(repoDir);
  for (const entry of data.entries) {
    if (!wanted.has(entry.id)) continue;
    entry.status = 'pending';
    entry.version = null;
    entry.shippedAt = null;
  }
  return writeChangelog(repoDir, data);
}

function deployCommitMessage(title, entries) {
  const subject = String(title || 'Deploy').replace(/\s+/g, ' ').trim();
  const lines = [];
  const seen = new Set();
  for (const entry of entries || []) {
    const message = String(entry?.message ?? entry ?? '').replace(/\s+/g, ' ').trim();
    const key = message.toLowerCase();
    if (!message || seen.has(key)) continue;
    seen.add(key);
    const label = moduleLabel(entry?.module);
    lines.push(label ? `- ${label}: ${message}` : `- ${message}`);
    if (lines.length >= 80) break;
  }
  if (!lines.length) return subject;
  return `${subject}\n\n${lines.join('\n')}\n`;
}

function commitWithMessage(repoDir, message, pathspec) {
  const file = path.join(os.tmpdir(), `synergy-commit-${process.pid}-${Date.now()}.txt`);
  const body = String(message || '').endsWith('\n') ? String(message) : `${message}\n`;
  fs.writeFileSync(file, body, 'utf8');
  const spec = Array.isArray(pathspec) && pathspec.length
    ? ` -- ${pathspec.map((item) => `"${item}"`).join(' ')}`
    : '';
  console.log('> git commit (mensaje de deploy)');
  try {
    execSync(`git commit -F "${file}"${spec}`, {
      stdio: 'inherit',
      cwd: repoDir,
      shell: true,
      env: process.env,
    });
  } finally {
    fs.rmSync(file, { force: true });
  }
}

function shipPendingChangelog(repoDir, version) {
  const shipped = markPendingShipped(repoDir, { version });
  if (!shipped.length) return shipped;
  const message = deployCommitMessage(`Changelog ${version}`, shipped);
  try {
    execSync('git add -- scripts/changelog.json scripts/CHANGELOG.md', {
      stdio: 'inherit',
      cwd: repoDir,
      shell: true,
      env: process.env,
    });
    commitWithMessage(repoDir, message, ['scripts/changelog.json', 'scripts/CHANGELOG.md']);
  } catch (error) {
    restorePending(repoDir, shipped.map((entry) => entry.id));
    throw error;
  }
  console.log('Changelog marcado como enviado en un commit local del backend. Se publica en el próximo push de ese repo.');
  return shipped;
}

function readFlag(name) {
  const index = process.argv.indexOf(name);
  if (index < 0) return '';
  return process.argv[index + 1] || '';
}

if (require.main === module && process.argv.includes('--render')) {
  const repoDir = path.resolve(__dirname, '..', '..');
  const paths = changelogPaths(repoDir);
  fs.writeFileSync(paths.md, renderMarkdown(readChangelog(repoDir)));
  console.log('Lectura actualizada en scripts/CHANGELOG.md.');
} else if (require.main === module) {
  const scope = readFlag('--scope') || 'both';
  const moduleCode = readFlag('--module') || process.env.CHANGELOG_MODULE || '';
  const message = readFlag('--message') || process.env.CHANGELOG_MESSAGE || '';
  try {
    appendEntry(path.resolve(__dirname, '..', '..'), { scope, module: moduleCode, message });
    console.log('Solicitud anotada en scripts/CHANGELOG.md (pendiente).');
  } catch (error) {
    console.error(error.message || error);
    process.exit(1);
  }
}

module.exports = {
  appendEntry,
  pendingEntries,
  markPendingShipped,
  restorePending,
  deployCommitMessage,
  commitWithMessage,
  shipPendingChangelog,
  readChangelog,
  renderMarkdown,
};
