const fs = require('fs');
const path = require('path');
const {
  buildReleasePayload,
  mergeReleaseChanges,
} = require('./lib/release-notes');

const rootDir = path.resolve(__dirname, '..');
const catalogJsonPath = path.join(rootDir, 'src', 'api', 'system-versions', 'data', 'releases.json');
const catalogTsPath = path.join(
  rootDir,
  'src',
  'api',
  'system-versions',
  'data',
  'releases.generated.ts',
);

function readPayloadFromArgv() {
  const flag = process.argv.indexOf('--payload');
  const payloadPath = flag >= 0 ? process.argv[flag + 1] : '';
  if (!payloadPath) {
    throw new Error('Falta --payload <archivo.json>');
  }
  const absolute = path.resolve(payloadPath);
  return JSON.parse(fs.readFileSync(absolute, 'utf8'));
}

function normalizePayload(input) {
  if (input?.releaseKey && input?.version) {
    const channel = input.channel === 'backend' || input.channel === 'full' ? input.channel : 'frontend';
    const version = String(input.version).slice(0, 32);
    const buildId = input.buildId ? String(input.buildId).slice(0, 80) : null;
    const releasedAt = input.releasedAt || new Date().toISOString();
    return {
      releaseKey: String(input.releaseKey).slice(0, 160),
      version,
      buildId,
      channel,
      title: String(input.title || `Versión ${version}`).slice(0, 180),
      changes: mergeReleaseChanges([input.changes || []]),
      releasedAt,
    };
  }

  return buildReleasePayload({
    version: input?.version,
    buildId: input?.buildId,
    channel: input?.channel || 'backend',
    changes: input?.changes || [],
    releasedAt: input?.releasedAt,
  });
}

function upsertCatalog(payload) {
  const current = fs.existsSync(catalogJsonPath)
    ? JSON.parse(fs.readFileSync(catalogJsonPath, 'utf8'))
    : [];
  const list = Array.isArray(current) ? current : [];
  const withoutCurrent = list.filter((item) => item?.releaseKey !== payload.releaseKey);
  withoutCurrent.push(payload);
  const trimmed = withoutCurrent.slice(-200);

  fs.mkdirSync(path.dirname(catalogJsonPath), { recursive: true });
  fs.writeFileSync(catalogJsonPath, `${JSON.stringify(trimmed, null, 2)}\n`);
  const catalogType = `Array<{
  releaseKey: string;
  version: string;
  buildId: string | null;
  channel: 'frontend' | 'backend' | 'full';
  title: string;
  changes: Array<{ scope: 'frontend' | 'backend'; message: string }>;
  releasedAt: string;
}>`;
  fs.writeFileSync(
    catalogTsPath,
    `// Generado por scripts/record-system-version.js — no editar a mano\nexport const SYSTEM_VERSION_RELEASES: ${catalogType} = ${JSON.stringify(trimmed, null, 2)};\n`,
  );

  return trimmed.length;
}

async function recordRelease(rawPayload) {
  const payload = normalizePayload(rawPayload);
  const total = upsertCatalog(payload);
  console.log(
    `Catálogo de versiones actualizado (${total} releases). ${payload.version} (${payload.channel}) se filtra por los módulos de cada organización al consultarlo.`,
  );
  return payload;
}

async function main() {
  const payload = readPayloadFromArgv();
  await recordRelease(payload);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  });
}

module.exports = { recordRelease, upsertCatalog, normalizePayload };
