const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const thisRepo = path.resolve(__dirname, '..');
const parent = path.dirname(thisRepo);
const frontendDir = path.join(parent, 'sinergy-erp-frontend-clients');
const backendDir = path.join(parent, 'sinergy-erp-backend-clients');

function run(command, cwd) {
  console.log(`\n[${path.basename(cwd)}] ${command}`);
  execSync(command, { stdio: 'inherit', cwd, shell: true, env: process.env });
}

function getSshKeyPath() {
  return path.resolve(thisRepo, '..', '..', '..', 'ssh', 'sinergy');
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

if (!fs.existsSync(frontendDir) || !fs.existsSync(backendDir)) {
  console.error('Se esperan estas carpetas hermanas:');
  console.error(`  ${frontendDir}`);
  console.error(`  ${backendDir}`);
  process.exit(1);
}

ensureGitSshAuth();

console.log('=== Frontend: build + commit + push ===');
run('npm run build:deploy', frontendDir);

console.log('=== Backend: build + commit dist + push ===');
run('npm run build:deploy', backendDir);

console.log('\nDeploy front + back listo.');
