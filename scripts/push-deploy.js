const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { collectChanges, buildReleasePayload, writeReleaseSnapshot } = require('./lib/release-notes');
const {
  markPendingShipped,
  restorePending,
  deployCommitMessage,
  commitWithMessage,
} = require('./lib/session-changelog');

const rootDir = path.resolve(__dirname, '..');

function run(command) {
  console.log(`> ${command}`);
  execSync(command, { stdio: 'inherit', cwd: rootDir, shell: true, env: process.env });
}

function runOutput(command) {
  return execSync(command, { encoding: 'utf8', cwd: rootDir, shell: true, env: process.env }).trim();
}

function changelogVersion(backendVersion) {
  const frontendReleasePath = path.join(
    rootDir,
    '..',
    'sinergy-erp-frontend-clients',
    'scripts',
    '.last-release.json',
  );
  if (process.env.DEPLOY_BOTH === '1' && fs.existsSync(frontendReleasePath)) {
    try {
      const payload = JSON.parse(fs.readFileSync(frontendReleasePath, 'utf8'));
      if (payload.version) return String(payload.version);
    } catch {
      // Se usa la versión del backend.
    }
  }
  return backendVersion;
}

function recordPublishedRelease(version, backendChanges) {
  const frontendReleasePath = path.join(
    rootDir,
    '..',
    'sinergy-erp-frontend-clients',
    'scripts',
    '.last-release.json',
  );
  const combinedDeploy = process.env.DEPLOY_BOTH === '1';
  let payload;

  if (combinedDeploy && fs.existsSync(frontendReleasePath)) {
    payload = JSON.parse(fs.readFileSync(frontendReleasePath, 'utf8'));
  } else {
    if (combinedDeploy) {
      console.warn('deploy:both no dejó la versión del frontend. Se registra solo el backend.');
    }
    payload = buildReleasePayload({
      version,
      buildId: `${version}-backend-${Date.now()}`,
      channel: 'backend',
      changes: backendChanges,
      releasedAt: new Date().toISOString(),
    });
  }

  const payloadPath = path.join(rootDir, 'scripts', '.release-payload.json');
  fs.writeFileSync(payloadPath, `${JSON.stringify(payload, null, 2)}\n`);

  try {
    run(`node scripts/record-system-version.js --payload "${payloadPath}"`);
    writeReleaseSnapshot(rootDir);
    if (combinedDeploy) {
      writeReleaseSnapshot(path.join(rootDir, '..', 'sinergy-erp-frontend-clients'));
    }
  } catch (error) {
    console.warn(`No se pudo registrar la versión: ${error.message}`);
  }
}

function getSshKeyPath() {
  return path.resolve(rootDir, '..', '..', '..', 'ssh', 'sinergy');
}

function ensureGitSshAuth() {
  const keyPath = getSshKeyPath();
  if (!fs.existsSync(keyPath)) {
    console.warn(`SSH key not found at ${keyPath}; git push may fail.`);
    return;
  }

  const keyForSsh = keyPath.replace(/\\/g, '/');
  process.env.GIT_SSH_COMMAND = `ssh -i "${keyForSsh}" -o IdentitiesOnly=yes`;

  try {
    if (process.platform === 'win32') {
      execSync(
        'powershell -NoProfile -Command "Start-Service ssh-agent -ErrorAction SilentlyContinue"',
        { stdio: 'inherit', shell: true }
      );
    }
    execSync(`ssh-add "${keyPath}"`, { stdio: 'inherit', shell: true });
  } catch {
    // GIT_SSH_COMMAND alcanza para git push.
  }
}

ensureGitSshAuth();

const backendChanges = collectChanges(rootDir, 'backend');

run('npm version patch --no-git-tag-version');

const { version } = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));

recordPublishedRelease(version, backendChanges);

run('npm run build');

const distMain = path.join(rootDir, 'dist', 'main.js');
if (!fs.existsSync(distMain)) {
  console.error('dist/main.js no existe. nest build no genero el compilado.');
  process.exit(1);
}

const shippedNotes = markPendingShipped(rootDir, { version: changelogVersion(version) });
const changelogFiles = ['scripts/changelog.json', 'scripts/CHANGELOG.md'].filter((rel) =>
  fs.existsSync(path.join(rootDir, rel)),
);

let notesCommitted = false;
try {
  run(
    `git add dist package.json package-lock.json src/api/system-versions/data/releases.json src/api/system-versions/data/releases.generated.ts${
      changelogFiles.length ? ` ${changelogFiles.join(' ')}` : ''
    }`,
  );

  const staged = runOutput('git diff --cached --name-only');
  if (!staged) {
    console.log('No hay cambios de dist para commitear.');
  } else {
    commitWithMessage(
      rootDir,
      deployCommitMessage(`Deploying version ${version}`, shippedNotes),
    );
    notesCommitted = true;
  }
} catch (error) {
  if (shippedNotes.length) {
    restorePending(rootDir, shippedNotes.map((entry) => entry.id));
  }
  throw error;
}

if (!notesCommitted && shippedNotes.length) {
  restorePending(rootDir, shippedNotes.map((entry) => entry.id));
}

run('git push origin main');
