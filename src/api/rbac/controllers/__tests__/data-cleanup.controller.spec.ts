/**
 * Unit tests for DataCleanupController
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { DataCleanupController } from '../data-cleanup.controller';
import { DataCleanupService, CleanupResult, IntegrityCheckResult, MaintenanceSchedule } from '../../services/data-cleanup.service';
import { TenantContextService } from '../../services/tenant-context.service';

// Create a simplified controller for testing without guards
class TestDataCleanupController {
  constructor(
    private readonly dataCleanupService: DataCleanupService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  // Copy all methods from the original controller but without decorators
  async performCleanup(options: any): Promise<CleanupResult> {
    const controller = new DataCleanupController(this.dataCleanupService, this.tenantContextService);
    return controller.performCleanup(options);
  }

  async performIntegrityCheck(options: any): Promise<IntegrityCheckResult> {
    const controller = new DataCleanupController(this.dataCleanupService, this.tenantContextService);
    return controller.performIntegrityCheck(options);
  }

  async getLastCleanupResult(): Promise<CleanupResult | null> {
    const controller = new DataCleanupController(this.dataCleanupService, this.tenantContextService);
    return controller.getLastCleanupResult();
  }

  async getLastIntegrityCheck(): Promise<IntegrityCheckResult | null> {
    const controller = new DataCleanupController(this.dataCleanupService, this.tenantContextService);
    return controller.getLastIntegrityCheck();
  }

  async getCleanupStatus(): Promise<any> {
    const controller = new DataCleanupController(this.dataCleanupService, this.tenantContextService);
    return controller.getCleanupStatus();
  }

  async getMaintenanceSchedule(): Promise<MaintenanceSchedule> {
    const controller = new DataCleanupController(this.dataCleanupService, this.tenantContextService);
    return controller.getMaintenanceSchedule();
  }

  async previewCleanup(options: any): Promise<any> {
    const controller = new DataCleanupController(this.dataCleanupService, this.tenantContextService);
    return controller.previewCleanup(options);
  }

  async getSystemHealth(tenantId?: string): Promise<any> {
    const controller = new DataCleanupController(this.dataCleanupService, this.tenantContextService);
    return controller.getSystemHealth(tenantId);
  }
}

describe('DataCleanupController', () => {
  let controller: TestDataCleanupController;
  let dataCleanupService: jest.Mocked<DataCleanupService>;
  let tenantContextService: jest.Mocked<TenantContextService>;

  const mockCleanupResult: CleanupResult = {
    executionTime: 5000,
    dryRun: true,
    statistics: {
      orphanedUserRoles: 5,
      orphanedRolePermissions: 3,
      unusedRoles: 2,
      unusedPermissions: 1,
      emptyTenants: 0,
      oldAuditLogs: 100,
    },
    actions: [
      '[DRY RUN] Removed 5 orphaned user role assignments',
      '[DRY RUN] Removed 3 orphaned role permission assignments',
    ],
    warnings: ['Found 2 empty tenants. Consider manual review before deletion.'],
    errors: [],
  };

  const mockIntegrityCheckResult: IntegrityCheckResult = {
    isHealthy: false,
    checkedAt: new Date('2024-01-15T10:00:00Z'),
    issues: [
      {
        type: 'orphaned_data',
        severity: 'high',
        description: 'Found 5 orphaned user role assignments',
        affectedCount: 5,
        recommendation: 'Run data cleanup to remove orphaned user role assignments',
      },
    ],
    performance: {
      totalUsers: 100,
      totalRoles: 10,
      totalPermissions: 50,
      totalUserRoles: 150,
      totalRolePermissions: 200,
      totalTenants: 5,
      averageRolesPerUser: 1.5,
      averagePermissionsPerRole: 20,
    },
    recommendations: ['Address 1 high-priority issues to maintain data integrity'],
  };

  const mockMaintenanceSchedule: MaintenanceSchedule = {
    enabled: true,
    schedule: '0 2 * * 0',
    defaultOptions: {
      dryRun: false,
      batchSize: 1000,
      cleanupUserRoles: true,
      cleanupRolePermissions: true,
      cleanupUnusedRoles: true,
      cleanupUnusedPermissions: true,
      cleanupEmptyTenants: false,
      cleanupOldAuditLogs: false,
      auditLogRetentionDays: 365,
    },
    notifyOnCompletion: false,
    notificationEmails: [],
  };

  beforeEach(async () => {
    const mockDataCleanupService = {
      performCleanup: jest.fn(),
      performIntegrityCheck: jest.fn(),
      getLastCleanupResult: jest.fn(),
      getLastIntegrityCheck: jest.fn(),
      isCleanupInProgress: jest.fn(),
      getMaintenanceSchedule: jest.fn(),
    };

    const mockTenantContextService = {
      getCurrentTenantId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TestDataCleanupController],
      providers: [
        {
          provide: DataCleanupService,
          useValue: mockDataCleanupService,
        },
        {
          provide: TenantContextService,
          useValue: mockTenantContextService,
        },
      ],
    }).compile();

    controller = module.get<TestDataCleanupController>(TestDataCleanupController);
    dataCleanupService = module.get(DataCleanupService);
    tenantContextService = module.get(TenantContextService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('performCleanup', () => {
    it('should perform cleanup with valid options', async () => {
      // Arrange
      const options = {
        dryRun: true,
        cleanupUserRoles: true,
        cleanupRolePermissions: true,
      };

      dataCleanupService.isCleanupInProgress.mockReturnValue(false);
      dataCleanupService.performCleanup.mockResolvedValue(mockCleanupResult);

      // Act
      const result = await controller.performCleanup(options);

      // Assert
      expect(result).toBe(mockCleanupResult);
      expect(dataCleanupService.performCleanup).toHaveBeenCalledWith(options);
    });

    it('should throw error when cleanup is already in progress', async () => {
      // Arrange
      const options = { dryRun: true };
      dataCleanupService.isCleanupInProgress.mockReturnValue(true);

      // Act & Assert
      await expect(controller.performCleanup(options)).rejects.toThrow(BadRequestException);
      expect(dataCleanupService.performCleanup).not.toHaveBeenCalled();
    });

    it('should validate batch size', async () => {
      // Arrange
      const options = { batchSize: 0 };

      // Act & Assert
      await expect(controller.performCleanup(options)).rejects.toThrow(BadRequestException);
      expect(dataCleanupService.performCleanup).not.toHaveBeenCalled();
    });

    it('should validate audit log retention days', async () => {
      // Arrange
      const options = { auditLogRetentionDays: 0 };

      // Act & Assert
      await expect(controller.performCleanup(options)).rejects.toThrow(BadRequestException);
      expect(dataCleanupService.performCleanup).not.toHaveBeenCalled();
    });

    it('should validate audit log retention for non-dry runs', async () => {
      // Arrange
      const options = {
        dryRun: false,
        cleanupOldAuditLogs: true,
        auditLogRetentionDays: 30,
      };

      // Act & Assert
      await expect(controller.performCleanup(options)).rejects.toThrow(BadRequestException);
      expect(dataCleanupService.performCleanup).not.toHaveBeenCalled();
    });

    it('should restrict tenant-specific cleanup to current tenant', async () => {
      // Arrange
      const options = { tenantId: 'other-tenant' };
      tenantContextService.getCurrentTenantId.mockReturnValue('current-tenant');

      // Act & Assert
      await expect(controller.performCleanup(options)).rejects.toThrow(ForbiddenException);
      expect(dataCleanupService.performCleanup).not.toHaveBeenCalled();
    });

    it('should allow tenant-specific cleanup for current tenant', async () => {
      // Arrange
      const options = { tenantId: 'current-tenant' };
      tenantContextService.getCurrentTenantId.mockReturnValue('current-tenant');
      dataCleanupService.isCleanupInProgress.mockReturnValue(false);
      dataCleanupService.performCleanup.mockResolvedValue(mockCleanupResult);

      // Act
      const result = await controller.performCleanup(options);

      // Assert
      expect(result).toBe(mockCleanupResult);
      expect(dataCleanupService.performCleanup).toHaveBeenCalledWith(options);
    });
  });

  describe('performIntegrityCheck', () => {
    it('should perform integrity check successfully', async () => {
      // Arrange
      const options = {};
      dataCleanupService.performIntegrityCheck.mockResolvedValue(mockIntegrityCheckResult);

      // Act
      const result = await controller.performIntegrityCheck(options);

      // Assert
      expect(result).toBe(mockIntegrityCheckResult);
      expect(dataCleanupService.performIntegrityCheck).toHaveBeenCalledWith(undefined);
    });

    it('should restrict tenant-specific check to current tenant', async () => {
      // Arrange
      const options = { tenantId: 'other-tenant' };
      tenantContextService.getCurrentTenantId.mockReturnValue('current-tenant');

      // Act & Assert
      await expect(controller.performIntegrityCheck(options)).rejects.toThrow(ForbiddenException);
      expect(dataCleanupService.performIntegrityCheck).not.toHaveBeenCalled();
    });

    it('should allow tenant-specific check for current tenant', async () => {
      // Arrange
      const options = { tenantId: 'current-tenant' };
      tenantContextService.getCurrentTenantId.mockReturnValue('current-tenant');
      dataCleanupService.performIntegrityCheck.mockResolvedValue(mockIntegrityCheckResult);

      // Act
      const result = await controller.performIntegrityCheck(options);

      // Assert
      expect(result).toBe(mockIntegrityCheckResult);
      expect(dataCleanupService.performIntegrityCheck).toHaveBeenCalledWith('current-tenant');
    });
  });

  describe('getLastCleanupResult', () => {
    it('should return last cleanup result', async () => {
      // Arrange
      dataCleanupService.getLastCleanupResult.mockReturnValue(mockCleanupResult);

      // Act
      const result = await controller.getLastCleanupResult();

      // Assert
      expect(result).toBe(mockCleanupResult);
    });

    it('should return null when no cleanup has been performed', async () => {
      // Arrange
      dataCleanupService.getLastCleanupResult.mockReturnValue(null);

      // Act
      const result = await controller.getLastCleanupResult();

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getLastIntegrityCheck', () => {
    it('should return last integrity check result', async () => {
      // Arrange
      dataCleanupService.getLastIntegrityCheck.mockReturnValue(mockIntegrityCheckResult);

      // Act
      const result = await controller.getLastIntegrityCheck();

      // Assert
      expect(result).toBe(mockIntegrityCheckResult);
    });

    it('should return null when no integrity check has been performed', async () => {
      // Arrange
      dataCleanupService.getLastIntegrityCheck.mockReturnValue(null);

      // Act
      const result = await controller.getLastIntegrityCheck();

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getCleanupStatus', () => {
    it('should return cleanup status with last execution times', async () => {
      // Arrange
      dataCleanupService.isCleanupInProgress.mockReturnValue(false);
      dataCleanupService.getLastCleanupResult.mockReturnValue({
        ...mockCleanupResult,
        executionTime: 5000,
      });
      dataCleanupService.getLastIntegrityCheck.mockReturnValue(mockIntegrityCheckResult);

      // Act
      const result = await controller.getCleanupStatus();

      // Assert
      expect(result.isRunning).toBe(false);
      expect(result.lastCleanupAt).toBeInstanceOf(Date);
      expect(result.lastIntegrityCheckAt).toBe(mockIntegrityCheckResult.checkedAt);
    });

    it('should return null dates when no operations have been performed', async () => {
      // Arrange
      dataCleanupService.isCleanupInProgress.mockReturnValue(false);
      dataCleanupService.getLastCleanupResult.mockReturnValue(null);
      dataCleanupService.getLastIntegrityCheck.mockReturnValue(null);

      // Act
      const result = await controller.getCleanupStatus();

      // Assert
      expect(result.isRunning).toBe(false);
      expect(result.lastCleanupAt).toBeNull();
      expect(result.lastIntegrityCheckAt).toBeNull();
    });
  });

  describe('getMaintenanceSchedule', () => {
    it('should return maintenance schedule', async () => {
      // Arrange
      dataCleanupService.getMaintenanceSchedule.mockReturnValue(mockMaintenanceSchedule);

      // Act
      const result = await controller.getMaintenanceSchedule();

      // Assert
      expect(result).toBe(mockMaintenanceSchedule);
    });
  });

  describe('previewCleanup', () => {
    it('should preview cleanup operation', async () => {
      // Arrange
      const options = {
        cleanupUserRoles: true,
        cleanupRolePermissions: true,
      };

      dataCleanupService.performCleanup.mockResolvedValue(mockCleanupResult);

      // Act
      const result = await controller.previewCleanup(options);

      // Assert
      expect(result.wouldCleanup).toBe(mockCleanupResult.statistics);
      expect(result.estimatedExecutionTime).toBe('1 seconds');
      expect(result.recommendations).toContain('5 orphaned user roles will be removed');
      expect(result.recommendations).toContain('3 orphaned role permissions will be removed');
      expect(result.warnings).toContain('Found 2 empty tenants. Consider manual review before deletion.');
      expect(dataCleanupService.performCleanup).toHaveBeenCalledWith({
        ...options,
        dryRun: true,
      });
    });

    it('should estimate execution time correctly', async () => {
      // Arrange
      const options = {};
      const largeCleanupResult = {
        ...mockCleanupResult,
        statistics: {
          ...mockCleanupResult.statistics,
          orphanedUserRoles: 5000,
          orphanedRolePermissions: 3000,
        },
      };

      dataCleanupService.performCleanup.mockResolvedValue(largeCleanupResult);

      // Act
      const result = await controller.previewCleanup(options);

      // Assert
      expect(result.estimatedExecutionTime).toBe('1 minutes'); // 8000+ items should take more than 60 seconds
    });

    it('should handle empty cleanup preview', async () => {
      // Arrange
      const options = {};
      const emptyCleanupResult = {
        ...mockCleanupResult,
        statistics: {
          orphanedUserRoles: 0,
          orphanedRolePermissions: 0,
          unusedRoles: 0,
          unusedPermissions: 0,
          emptyTenants: 0,
          oldAuditLogs: 0,
        },
        actions: [],
        warnings: [],
      };

      dataCleanupService.performCleanup.mockResolvedValue(emptyCleanupResult);

      // Act
      const result = await controller.previewCleanup(options);

      // Assert
      expect(result.recommendations).toContain('No cleanup needed - system is clean');
    });

    it('should restrict tenant-specific preview to current tenant', async () => {
      // Arrange
      const options = { tenantId: 'other-tenant' };
      tenantContextService.getCurrentTenantId.mockReturnValue('current-tenant');

      // Act & Assert
      await expect(controller.previewCleanup(options)).rejects.toThrow(ForbiddenException);
      expect(dataCleanupService.performCleanup).not.toHaveBeenCalled();
    });
  });

  describe('getSystemHealth', () => {
    it('should return system health summary', async () => {
      // Arrange
      dataCleanupService.getLastIntegrityCheck.mockReturnValue(mockIntegrityCheckResult);
      dataCleanupService.getMaintenanceSchedule.mockReturnValue(mockMaintenanceSchedule);

      // Act
      const result = await controller.getSystemHealth();

      // Assert
      expect(result.overallHealth).toBe('warning'); // 1 high issue
      expect(result.lastChecked).toBe(mockIntegrityCheckResult.checkedAt);
      expect(result.criticalIssues).toBe(0);
      expect(result.highIssues).toBe(1);
      expect(result.mediumIssues).toBe(0);
      expect(result.lowIssues).toBe(0);
      expect(result.cleanupRecommended).toBe(true); // 1 high issue
      expect(result.nextScheduledCleanup).toBe(mockMaintenanceSchedule.schedule);
      expect(result.quickStats).toBe(mockIntegrityCheckResult.performance);
    });

    it('should return healthy status when no issues exist', async () => {
      // Arrange
      const healthyIntegrityCheck = {
        ...mockIntegrityCheckResult,
        isHealthy: true,
        issues: [],
      };

      dataCleanupService.getLastIntegrityCheck.mockReturnValue(healthyIntegrityCheck);
      dataCleanupService.getMaintenanceSchedule.mockReturnValue(mockMaintenanceSchedule);

      // Act
      const result = await controller.getSystemHealth();

      // Assert
      expect(result.overallHealth).toBe('healthy');
      expect(result.criticalIssues).toBe(0);
      expect(result.highIssues).toBe(0);
      expect(result.cleanupRecommended).toBe(false);
    });

    it('should return critical status when critical issues exist', async () => {
      // Arrange
      const criticalIntegrityCheck = {
        ...mockIntegrityCheckResult,
        issues: [
          {
            type: 'constraint_violation' as const,
            severity: 'critical' as const,
            description: 'Critical system error',
            affectedCount: 1,
            recommendation: 'Fix immediately',
          },
        ],
      };

      dataCleanupService.getLastIntegrityCheck.mockReturnValue(criticalIntegrityCheck);
      dataCleanupService.getMaintenanceSchedule.mockReturnValue(mockMaintenanceSchedule);

      // Act
      const result = await controller.getSystemHealth();

      // Assert
      expect(result.overallHealth).toBe('critical');
      expect(result.criticalIssues).toBe(1);
      expect(result.cleanupRecommended).toBe(true);
    });

    it('should handle no previous integrity check', async () => {
      // Arrange
      dataCleanupService.getLastIntegrityCheck.mockReturnValue(null);
      dataCleanupService.getMaintenanceSchedule.mockReturnValue(mockMaintenanceSchedule);

      // Act
      const result = await controller.getSystemHealth();

      // Assert
      expect(result.overallHealth).toBe('healthy');
      expect(result.lastChecked).toBeNull();
      expect(result.criticalIssues).toBe(0);
      expect(result.quickStats.totalUsers).toBe(0);
    });

    it('should restrict tenant-specific health check to current tenant', async () => {
      // Arrange
      tenantContextService.getCurrentTenantId.mockReturnValue('current-tenant');

      // Act & Assert
      await expect(controller.getSystemHealth('other-tenant')).rejects.toThrow(ForbiddenException);
    });
  });
});