import { ForbiddenException } from '@nestjs/common';
import { SystemVersionsService } from './system-versions.service';

describe('SystemVersionsService', () => {
  function createService(codes: string[]) {
    const query = jest.fn().mockResolvedValue(codes.map((code) => ({ code })));
    const service = new SystemVersionsService({ query } as never);
    return { service, query };
  }

  it('arma el historial desde el catálogo y no lee system_versions', async () => {
    const { service, query } = createService(['system-versions', 'customers']);

    const page = await service.findAll('org-1', { page: 1, limit: 20 });

    expect(query).toHaveBeenCalledTimes(1);
    expect(String(query.mock.calls[0][0])).not.toContain('system_versions');
    expect(String(query.mock.calls[0][0])).toContain('tenant_modules');
    expect(page.data.length).toBeGreaterThan(0);
    const labels = page.data.flatMap((item) => item.changes.map((change) => change.module_label));
    expect(labels).toContain('Clientes');
    expect(labels).not.toContain('Contratos');
    expect(page.data[0].released_at >= page.data[page.data.length - 1].released_at).toBe(true);

    await service.findLatest('org-1');
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('responde 403 si la organización no tiene el módulo y no guarda caché', async () => {
    const { service, query } = createService(['customers']);

    await expect(service.findAll('org-2', { page: 1, limit: 20 })).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.findLatest('org-2')).rejects.toBeInstanceOf(ForbiddenException);
    expect(query).toHaveBeenCalledTimes(2);
  });
});
