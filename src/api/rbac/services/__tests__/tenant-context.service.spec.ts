import { Test, TestingModule } from '@nestjs/testing';
import { TenantContextService } from '../tenant-context.service';

describe('TenantContextService', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [TenantContextService],
    }).compile();
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', async () => {
    const service = await module.resolve<TenantContextService>(TenantContextService);
    expect(service).toBeDefined();
  });

  describe('tenant context management', () => {
    it('should set and get tenant context', async () => {
      const service = await module.resolve<TenantContextService>(TenantContextService);
      const tenantId = 'tenant-123';
      const userId = 'user-456';

      service.setTenantContext(tenantId, userId);

      expect(service.getCurrentTenantId()).toBe(tenantId);
      expect(service.getCurrentUserId()).toBe(userId);
      expect(service.hasContext()).toBe(true);
    });

    it('should return null when no context is set', async () => {
      const service = await module.resolve<TenantContextService>(TenantContextService);
      expect(service.getCurrentTenantId()).toBeNull();
      expect(service.getCurrentUserId()).toBeNull();
      expect(service.hasContext()).toBe(false);
    });

    it('should clear context', async () => {
      const service = await module.resolve<TenantContextService>(TenantContextService);
      service.setTenantContext('tenant-123', 'user-456');
      expect(service.hasContext()).toBe(true);

      service.clearContext();
      expect(service.getCurrentTenantId()).toBeNull();
      expect(service.getCurrentUserId()).toBeNull();
      expect(service.hasContext()).toBe(false);
    });

    it('should validate context correctly', async () => {
      const service = await module.resolve<TenantContextService>(TenantContextService);
      const tenantId = 'tenant-123';
      const userId = 'user-456';

      service.setTenantContext(tenantId, userId);

      expect(service.validateContext(tenantId, userId)).toBe(true);
      expect(service.validateContext(tenantId)).toBe(true);
      expect(service.validateContext(undefined, userId)).toBe(true);
      expect(service.validateContext('wrong-tenant', userId)).toBe(false);
      expect(service.validateContext(tenantId, 'wrong-user')).toBe(false);
    });

    it('should return false for validation when no context is set', async () => {
      const service = await module.resolve<TenantContextService>(TenantContextService);
      expect(service.validateContext('tenant-123')).toBe(false);
      expect(service.validateContext(undefined, 'user-456')).toBe(false);
    });
  });
});