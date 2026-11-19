import { ReleasePayload } from './release-notes.util';
import { listReleasesForTenant, paginateTenantReleases } from './tenant-release-list.util';

const releases: ReleasePayload[] = [
  {
    releaseKey: 'full:0.0.2:b2',
    version: '0.0.2',
    buildId: 'b2',
    channel: 'full',
    title: 'Versión 0.0.2',
    releasedAt: '2026-11-02T18:00:00.000Z',
    changes: [
      { scope: 'frontend', message: 'Cambios en clientes' },
      { scope: 'backend', message: 'Cambios en contratos' },
      { scope: 'backend', message: 'Cambios en inmuebles' },
    ],
  },
  {
    releaseKey: 'full:0.0.1:b1',
    version: '0.0.1',
    buildId: 'b1',
    channel: 'full',
    title: 'Versión 0.0.1',
    releasedAt: '2026-10-01T18:00:00.000Z',
    changes: [
      { scope: 'backend', message: 'Cambios en contratos' },
    ],
  },
];

describe('listReleasesForTenant', () => {
  it('deja solo los cambios de los módulos activos y omite releases vacíos', () => {
    const items = listReleasesForTenant(releases, ['customers', 'system-versions']);

    expect(items).toEqual([
      {
        id: 'full:0.0.2:b2',
        version: '0.0.2',
        build_id: 'b2',
        channel: 'full',
        title: 'Versión 0.0.2',
        released_at: '2026-11-02T18:00:00.000Z',
        changes: [{ scope: 'frontend', message: 'Cambios en clientes' }],
      },
    ]);
  });

  it('pagina y busca en memoria', () => {
    const items = listReleasesForTenant(releases, ['contracts']);
    const page = paginateTenantReleases(items, 1, 1, '0.0.1');

    expect(page.total).toBe(1);
    expect(page.data[0].version).toBe('0.0.1');
    expect(page.totalPages).toBe(1);
    expect(page.hasNext).toBe(false);
  });
});
