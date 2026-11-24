const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const changelog = require('../../../../scripts/lib/session-changelog');

function gitEnv() {
  return {
    ...process.env,
    GIT_AUTHOR_NAME: 'Changelog Test',
    GIT_AUTHOR_EMAIL: 'changelog@example.com',
    GIT_COMMITTER_NAME: 'Changelog Test',
    GIT_COMMITTER_EMAIL: 'changelog@example.com',
  };
}

function runGit(repoDir, command, env) {
  return execSync(command, {
    cwd: repoDir,
    encoding: 'utf8',
    shell: true,
    env,
  }).trim();
}

describe('session changelog', () => {
  let dir = '';

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'synergy-changelog-'));
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('anota una solicitud pendiente y no la duplica', () => {
    changelog.appendEntry(dir, { scope: 'both', message: 'Importa el padrón de inmuebles' });
    changelog.appendEntry(dir, { scope: 'frontend', message: 'Importa el padrón de inmuebles' });

    const pending = changelog.pendingEntries(dir);
    expect(pending).toHaveLength(1);
    expect(pending[0].status).toBe('pending');
    expect(pending[0].scope).toBe('both');

    const markdown = fs.readFileSync(path.join(dir, 'scripts', 'CHANGELOG.md'), 'utf8');
    expect(markdown).toContain('## Pendientes');
    expect(markdown).toContain('aplicación y servidor · Importa el padrón de inmuebles');
    expect(markdown).toContain('Todavía no hay un deploy con este registro.');
  });

  it('el deploy publica solo las pendientes y puede revertirlas si el commit falla', () => {
    changelog.appendEntry(dir, { scope: 'backend', message: 'Corrige el corte de caja' });
    changelog.appendEntry(dir, { scope: 'frontend', message: 'Muestra el corte en dólares' });
    const first = changelog.markPendingShipped(dir, { version: '1.2.3', releasedAt: '2026-10-27T18:00:00-07:00' });

    expect(first.map((entry) => entry.message)).toEqual([
      'Corrige el corte de caja',
      'Muestra el corte en dólares',
    ]);
    expect(changelog.pendingEntries(dir)).toEqual([]);
    expect(changelog.markPendingShipped(dir, { version: '1.2.4' })).toEqual([]);

    const markdown = fs.readFileSync(path.join(dir, 'scripts', 'CHANGELOG.md'), 'utf8');
    expect(markdown).toContain('No hay solicitudes pendientes de deploy.');
    expect(markdown).toContain('### Octubre 2026');
    expect(markdown).toContain('#### Versión 1.2.3 · 27 oct');
    expect(markdown).toContain('servidor · Corrige el corte de caja');

    changelog.restorePending(dir, [first[0].id]);
    expect(changelog.pendingEntries(dir).map((entry) => entry.message)).toEqual([
      'Corrige el corte de caja',
    ]);
  });

  it('arma el mensaje del commit con el título y las viñetas', () => {
    const message = changelog.deployCommitMessage('Deploying version 1.2.3', [
      { message: 'Corrige el corte de caja' },
      { message: 'Corrige el corte de caja' },
      { message: 'Muestra el corte en dólares' },
    ]);

    expect(message).toBe(
      'Deploying version 1.2.3\n\n- Corrige el corte de caja\n- Muestra el corte en dólares\n',
    );
    expect(changelog.deployCommitMessage('Deploying version 1.2.3', [])).toBe('Deploying version 1.2.3');
  });

  it('después de publicar ya no las vuelve a tomar', () => {
    changelog.appendEntry(dir, { scope: 'frontend', message: 'Ajusta el listado' });
    expect(changelog.pendingEntries(dir)).toHaveLength(1);
    changelog.markPendingShipped(dir, { version: '9.0.0', releasedAt: '2026-10-27T18:00:00-07:00' });
    expect(changelog.pendingEntries(dir)).toEqual([]);
  });

  it('guarda el módulo y lo muestra en la lectura', () => {
    changelog.appendEntry(dir, {
      scope: 'both',
      module: 'customers',
      message: 'El RFC queda en mayúsculas.',
    });

    const pending = changelog.pendingEntries(dir);
    expect(pending[0].module).toBe('customers');
    const markdown = fs.readFileSync(path.join(dir, 'scripts', 'CHANGELOG.md'), 'utf8');
    expect(markdown).toContain('Clientes · El RFC queda en mayúsculas.');
    expect(() => changelog.appendEntry(dir, {
      scope: 'both',
      module: 'no-existe',
      message: 'Otra cosa',
    })).toThrow('module no es válido');
  });

  it('rechaza un scope desconocido y un mensaje vacío', () => {
    expect(() => changelog.appendEntry(dir, { scope: 'mobile', message: 'Algo' })).toThrow(
      'scope debe ser frontend, backend o both',
    );
    expect(() => changelog.appendEntry(dir, { scope: 'backend', message: '   ' })).toThrow(
      'Falta el mensaje del changelog',
    );
  });

  it('cierra las pendientes en un commit que no arrastra otros archivos', () => {
    const env = gitEnv();
    const snapshot = {
      GIT_AUTHOR_NAME: process.env.GIT_AUTHOR_NAME,
      GIT_AUTHOR_EMAIL: process.env.GIT_AUTHOR_EMAIL,
      GIT_COMMITTER_NAME: process.env.GIT_COMMITTER_NAME,
      GIT_COMMITTER_EMAIL: process.env.GIT_COMMITTER_EMAIL,
    };
    Object.assign(process.env, env);

    try {
      runGit(dir, 'git init -b main', env);
      runGit(dir, 'git commit --allow-empty -m "init"', env);
      fs.writeFileSync(path.join(dir, 'other.txt'), 'no entra\n');
      runGit(dir, 'git add -- other.txt', env);

      changelog.appendEntry(dir, { scope: 'both', message: 'Deja el changelog en el commit' });
      changelog.shipPendingChangelog(dir, '1.2.3');

      const committed = runGit(dir, 'git show --name-only --pretty=format: HEAD', env);
      const body = runGit(dir, 'git log -1 --pretty=%B', env);
      const staged = runGit(dir, 'git diff --cached --name-only', env);

      expect(committed).toContain('scripts/changelog.json');
      expect(committed).toContain('scripts/CHANGELOG.md');
      expect(committed).not.toContain('other.txt');
      expect(staged).toContain('other.txt');
      expect(body.startsWith('Changelog 1.2.3')).toBe(true);
      expect(body).toContain('- Deja el changelog en el commit');
      expect(changelog.pendingEntries(dir)).toEqual([]);
    } finally {
      for (const [key, value] of Object.entries(snapshot)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
  });
});
