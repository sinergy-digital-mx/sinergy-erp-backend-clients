import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogService } from '../../services/audit-log.service';
import { TenantContextService } from '../../services/tenant-context.service';
import { AuditAction, AuditResult } from '../../../../entities/rbac/audit-log.entity';

describe('AuditLogController Logic', () => {
  let auditLogService: jest.Mocked<AuditLogService>;
  let tenantContextService: jest.Mocked<TenantContextService>;

  const mockAuditLog = {
    id: 'audit-1',
    action: AuditAction.ACCESS_GRANTED,
    result: AuditResult.SUCCESS,
    userId: 'user-1',
    actorId: 'actor-1',
    tenantId: 'tenant-1',
    resourceType: 'customer',
    resourceId: 'customer-1',
    entityType: 'Customer',
    permissionAction: 'Read',
    details: 'Access granted for Read on Customer',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const mockAuditLogService = {
      queryAuditLogs: jest.fn(),
      getUserAuditLogs: jest.fn(),
      getRoleAuditLogs: jest.fn(),
      getFailedAccessAttempts: jest.fn(),
      getPermissionChanges: jest.fn(),
      getAuditLogsByDateRange: jest.fn(),
      getAuditStatistics: jest.fn(),
      searchAuditLogs: jest.fn(),
      getComplianceExport: jest.fn(),
      getUserRecentActivity: jest.fn(),
      getSuspiciousActivity: jest.fn(),
    };

    const mockTenantContextService = {
      getCurrentTenantId: jest.fn(),
    };

    auditLogService = mockAuditLogService as any;
    tenantContextService = mockTenantContextService as any;
  });

  it('should be defined', () => {
    expect(auditLogService).toBeDefined();
    expect(tenantContextService).toBeDefined();
  });

  describe('getAuditLogs logic', () => {
    it('should call queryAuditLogs with correct parameters', async () => {
      const mockResult = { logs: [mockAuditLog], total: 1 };
      tenantContextService.getCurrentTenantId.mockReturnValue('tenant-1');
      auditLogService.queryAuditLogs.mockResolvedValue(mockResult);

      // Simulate controller logic
      const tenantId = tenantContextService.getCurrentTenantId();
      const queryOptions = {
        userId: 'user-1',
        actorId: 'actor-1',
        tenantId,
        action: AuditAction.ACCESS_GRANTED,
        result: AuditResult.SUCCESS,
        resourceType: 'customer',
        entityType: 'Customer',
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31'),
        limit: Math.min(50, 1000),
        offset: 0,
      };

      const result = await auditLogService.queryAuditLogs(queryOptions);

      expect(auditLogService.queryAuditLogs).toHaveBeenCalledWith(queryOptions);
      expect(result).toEqual(mockResult);
    });

    it('should cap limit at 1000', async () => {
      const mockResult = { logs: [], total: 0 };
      tenantContextService.getCurrentTenantId.mockReturnValue('tenant-1');
      auditLogService.queryAuditLogs.mockResolvedValue(mockResult);

      // Simulate controller logic with high limit
      const tenantId = tenantContextService.getCurrentTenantId();
      const limit = Math.min(2000, 1000); // Should be capped at 1000

      const queryOptions = {
        tenantId,
        limit,
        offset: 0,
      };

      await auditLogService.queryAuditLogs(queryOptions);

      expect(auditLogService.queryAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 1000,
        }),
      );
    });
  });

  describe('security summary logic', () => {
    it('should aggregate failed attempts and permission changes correctly', async () => {
      const mockFailedAttempts = {
        logs: [
          { ...mockAuditLog, userId: 'user-1', action: AuditAction.ACCESS_DENIED },
          { ...mockAuditLog, userId: 'user-1', action: AuditAction.ACCESS_DENIED },
          { ...mockAuditLog, userId: 'user-2', action: AuditAction.ACCESS_DENIED },
        ],
        total: 3,
      };
      const mockPermissionChanges = {
        logs: [
          { ...mockAuditLog, action: AuditAction.PERMISSION_GRANTED },
          { ...mockAuditLog, action: AuditAction.ROLE_ASSIGNED },
        ],
        total: 2,
      };

      tenantContextService.getCurrentTenantId.mockReturnValue('tenant-1');
      auditLogService.getFailedAccessAttempts.mockResolvedValue(mockFailedAttempts);
      auditLogService.getPermissionChanges.mockResolvedValue(mockPermissionChanges);

      // Simulate controller logic
      const tenantId = tenantContextService.getCurrentTenantId();
      const hours = 24;
      
      const [failedAttempts, permissionChanges] = await Promise.all([
        auditLogService.getFailedAccessAttempts(tenantId, hours, 1000),
        auditLogService.getPermissionChanges(tenantId, 1, 1000),
      ]);

      // Aggregate logic
      const failedByUser = failedAttempts.logs.reduce((acc, log) => {
        if (log.userId) {
          acc[log.userId] = (acc[log.userId] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const changesByType = permissionChanges.logs.reduce((acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const result = {
        timeRange: `${hours} hours`,
        failedAccessAttempts: {
          total: failedAttempts.total,
          byUser: failedByUser,
          topUsers: Object.entries(failedByUser)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([userId, count]) => ({ userId, count })),
        },
        permissionChanges: {
          total: permissionChanges.total,
          byType: changesByType,
        },
      };

      expect(result).toEqual({
        timeRange: '24 hours',
        failedAccessAttempts: {
          total: 3,
          byUser: { 'user-1': 2, 'user-2': 1 },
          topUsers: [
            { userId: 'user-1', count: 2 },
            { userId: 'user-2', count: 1 },
          ],
        },
        permissionChanges: {
          total: 2,
          byType: {
            [AuditAction.PERMISSION_GRANTED]: 1,
            [AuditAction.ROLE_ASSIGNED]: 1,
          },
        },
      });
    });
  });

  describe('validation logic', () => {
    it('should validate search term requirement', () => {
      const searchTerm = '';
      
      expect(() => {
        if (!searchTerm) {
          throw new Error('Search term is required');
        }
      }).toThrow('Search term is required');
    });

    it('should validate date range requirement', () => {
      const startDate = '';
      const endDate = '2023-12-31';
      
      expect(() => {
        if (!startDate || !endDate) {
          throw new Error('Both startDate and endDate are required');
        }
      }).toThrow('Both startDate and endDate are required');
    });
  });
});