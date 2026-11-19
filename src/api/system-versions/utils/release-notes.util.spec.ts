import {
  buildReleasePayload,
  changesFromSubjects,
  filterChangesForModules,
  mergeReleaseChanges,
  selectReleaseSubjects,
  summarizeChangedPaths,
} from './release-notes.util';

const notesJs = require('../../../../scripts/lib/release-notes');

describe('release notes', () => {
  const subjects = [
    'Deploying version 0.0.70',
    'Merge branch main',
    'Corrige el corte de caja en dólares',
    'Agrega el historial de versiones',
  ];

  it('omite commits de deploy y merges', () => {
    expect(selectReleaseSubjects(subjects)).toEqual([
      'Corrige el corte de caja en dólares',
      'Agrega el historial de versiones',
    ]);
  });

  it('usa un texto de respaldo si no hay cambios', () => {
    expect(changesFromSubjects(['Deploying version 1.0.0'], 'backend')).toEqual([
      { scope: 'backend', message: 'Actualización de la plataforma.' },
    ]);
  });

  it('no duplica el texto de respaldo cuando front y back no tienen commits', () => {
    expect(
      mergeReleaseChanges([
        changesFromSubjects([], 'frontend'),
        changesFromSubjects(['Merge branch develop'], 'backend'),
      ]),
    ).toEqual([{ scope: 'frontend', message: 'Actualización de la plataforma.' }]);
  });

  it('arma una clave estable por canal, versión y build', () => {
    const release = buildReleasePayload({
      version: '0.0.71',
      buildId: '0.0.71-100',
      channel: 'full',
      changes: changesFromSubjects(['Publica el módulo de versiones'], 'frontend'),
      releasedAt: '2026-10-26T18:00:00.000Z',
    });

    expect(release.releaseKey).toBe('full:0.0.71:0.0.71-100');
    expect(release.title).toBe('Versión 0.0.71');
    expect(release.changes).toEqual([
      { scope: 'frontend', message: 'Publica el módulo de versiones' },
    ]);
  });

  it('coincide con el script que corre en el deploy', () => {
    expect(notesJs.selectReleaseSubjects(subjects)).toEqual(selectReleaseSubjects(subjects));
    expect(notesJs.changesFromSubjects([], 'backend')).toEqual(changesFromSubjects([], 'backend'));
    expect(
      notesJs.mergeReleaseChanges([
        [{ scope: 'frontend', message: 'Actualización de la plataforma.' }],
        [{ scope: 'backend', message: 'Ajusta el corte' }],
      ]),
    ).toEqual(
      mergeReleaseChanges([
        [{ scope: 'frontend', message: 'Actualización de la plataforma.' }],
        [{ scope: 'backend', message: 'Ajusta el corte' }],
      ]),
    );

    const input = {
      version: '0.0.71',
      buildId: '0.0.71-100',
      channel: 'full' as const,
      changes: [{ scope: 'frontend' as const, message: 'Publica el módulo de versiones' }],
      releasedAt: '2026-10-26T18:00:00.000Z',
    };
    expect(notesJs.buildReleasePayload(input)).toEqual(buildReleasePayload(input));
  });

  it('agrupa los archivos tocados y omite el build', () => {
    const messages = summarizeChangedPaths([
      'src/api/contracts/contracts.service.ts',
      'src/api/contracts/docs/UI_CONTRACT_LIST.md',
      'src/api/whatsapp/whatsapp.module.ts',
      'dist/main.js',
      'package.json',
      'src/api/accounting/services/customer-debt-flow.service.ts',
    ]);

    expect(messages).toEqual([
      'Cambios en contratos',
      'Cambios en WhatsApp',
      'Cambios en contabilidad',
    ]);
    expect(notesJs.summarizeChangedPaths([
      'src/api/contracts/contracts.service.ts',
      'src/api/whatsapp/whatsapp.module.ts',
      'package-lock.json',
    ])).toEqual(messages.slice(0, 2));
  });

  it('oculta cambios de módulos que la organización no tiene activos', () => {
    expect(filterChangesForModules([
      { scope: 'backend', message: 'Cambios en contratos' },
      { scope: 'backend', message: 'Cambios en inmuebles' },
      { scope: 'backend', message: 'Cambios en CRM' },
      { scope: 'frontend', message: 'Cambios en clientes' },
      { scope: 'frontend', message: 'Cambios en versiones' },
    ], ['customers', 'system-versions'])).toEqual([
      { scope: 'frontend', message: 'Cambios en clientes' },
      { scope: 'frontend', message: 'Cambios en versiones' },
    ]);
  });
});
