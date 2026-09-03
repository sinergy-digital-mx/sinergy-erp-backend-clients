const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

function run(command) {
  console.log(`> ${command}`);
  execSync(command, { stdio: 'inherit', cwd: rootDir, shell: true, env: process.env });
}

function runOutput(command) {
  return execSync(command, { encoding: 'utf8', cwd: rootDir, shell: true, env: process.env }).trim();
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

run('npm run build');

const distMain = path.join(rootDir, 'dist', 'main.js');
if (!fs.existsSync(distMain)) {
  console.error('dist/main.js no existe. nest build no genero el compilado.');
  process.exit(1);
}

run('git add dist');

const status = runOutput('git status --porcelain');
if (!status) {
  console.log('No hay cambios de dist para commitear.');
} else {
  run('git commit -m "Deploy backend build"');
}

run('git push origin main');
