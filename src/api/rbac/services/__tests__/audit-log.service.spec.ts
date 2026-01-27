import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogService } from '../audit-log.service';
import { AuditLog, AuditAction, AuditResult } from '../../../../entities/rbac/audit-log.entity';
import { TenantContextService } from '../tenant-context.service';

describe('AuditLogService', () => {
  let service: AuditLogService;
  let auditLogRepository: jest.Mocked<Repository<AuditLog>>;
  let tenantContextService: jest.Mocked<TenantContextService>;

  const mockAuditLog: AuditLog = {
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
    roleId: null,
    permissionId: null,
    details: 'Access granted for Read on Customer',
    errorMessage: null,
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
    metadata: { source: 'api' },
    createdAt: new Date(),
    tenant: null,
  };

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockTenantContextService = {
      getCurrentTenantId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogService,
        {
          provide: getRepositoryToken(AuditLog),
          useValue: mockRepository,
        },
        {
          provide: TenantContextService,
          useValue: mockTenantContextService,
        },
      ],
    }).compile();

    service = module.get<AuditLogService>(AuditLogService);
    auditLogRepository = module.get(getRepositoryToken(AuditLog));
    tenantContextService = module.get(TenantContextService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAuditLog', () => {
    it('should create an audit log entry', async () => {
      const createData = {
        action: AuditAction.ACCESS_GRANTED,
        result: AuditResult.SUCCESS,
        userId: 'user-1',
        entityType: 'Customer',
        permissionAction: 'Read',
      };

      tenantContextService.getCurrentTenantId.mockReturnValue('tenant-1');
      auditLogRepository.create.mockReturnValue(mockAuditLog);
      auditLogRepository.save.mockResolvedValue(mockAuditLog);

      const result = await service.createAuditLog(createData);

      expect(auditLogRepository.create).toHaveBeenCalledWith({
        ...createData,
        tenantId: 'tenant-1',
      });
      expect(auditLogRepository.save).toHaveBeenCalledWith(mockAuditLog);
      expect(result).toEqual(mockAuditLog);
    });

    it('should use provided tenantId over context', async () => {
      const createData = {
        action: AuditAction.ACCESS_GRANTED,
        result: AuditResult.SUCCESS,
        userId: 'user-1',
        tenantId: 'specific-tenant',
        entityType: 'Customer',
        permissionAction: 'Read',
      };

      auditLogRepository.create.mockReturnValue(mockAuditLog);
      auditLogRepository.save.mockResolvedValue(mockAuditLog);

      await service.createAuditLog(createData);

      expect(auditLogRepository.create).toHaveBeenCalledWith(createData);
      expect(tenantContextService.getCurrentTenantId).not.toHaveBeenCalled();
    });
  });

  describe('logAccessAttempt', () => {
    it('should log successful access attempt', async () => {
      auditLogRepository.create.mockReturnValue(mockAuditLog);
      auditLogRepository.save.mockResolvedValue(mockAuditLog);

      const result = await service.logAccessAttempt(
        true,
        'user-1',
        'Customer',
        'Read',
        'customer-1',
        'tenant-1',
        undefined,
        '192.168.1.1',
        'Mozilla/5.0',
      );

      expect(auditLogRepository.create).toHaveBeenCalledWith({
        action: AuditAction.ACCESS_GRANTED,
        result: AuditResult.SUCCESS,
        userId: 'user-1',
        tenantId: 'tenant-1',
        entityType: 'Customer',
        permissionAction: 'Read',
        resourceType: 'customer',
        resourceId: 'customer-1',
        details: 'Access granted for Read on Customer',
        errorMessage: undefined,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        metadata: undefined,
      });
      expect(result).toEqual(mockAuditLog);
    });

    it('should log failed access attempt', async () => {
      const failedAuditLog = {
        ...mockAuditLog,
        action: AuditAction.ACCESS_DENIED,
        result: AuditResult.FAILURE,
        errorMessage: 'Insufficient permissions',
      };

      auditLogRepository.create.mockReturnValue(failedAuditLog);
      auditLogRepository.save.mockResolvedValue(failedAuditLog);

      const result = await service.logAccessAttempt(
        false,
        'user-1',
        'Customer',
        'Delete',
        'customer-1',
        'tenant-1',
        'Insufficient permissions',
      );

      expect(auditLogRepository.create).toHaveBeenCalledWith({
        action: AuditAction.ACCESS_DENIED,
        result: AuditResult.FAILURE,
        userId: 'user-1',
        tenantId: 'tenant-1',
        entityType: 'Customer',
        permissionAction: 'Delete',
        resourceType: 'customer',
        resourceId: 'customer-1',
        details: 'Access denied for Delete on Customer',
        errorMessage: 'Insufficient permissions',
        ipAddress: undefined,
        userAgent: undefined,
        metadata: undefined,
      });
      expect(result).toEqual(failedAuditLog);
    });
  });

  describe('logPermissionChange', () => {
    it('should log permission granted', async () => {
      auditLogRepository.create.mockReturnValue(mockAuditLog);
      auditLogRepository.save.mockResolvedValue(mockAuditLog);

      const result = await service.logPermissionChange(
        AuditAction.PERMISSION_GRANTED,
        'user-1',
        'admin-1',
        'permission-1',
        'Customer',
        'Read',
        'tenant-1',
      );

      expect(auditLogRepository.create).toHaveBeenCalledWith({
        action: AuditAction.PERMISSION_GRANTED,
        result: AuditResult.SUCCESS,
        userId: 'user-1',
        actorId: 'admin-1',
        tenantId: 'tenant-1',
        permissionId: 'permission-1',
        entityType: 'Customer',
        permissionAction: 'Read',
        resourceType: 'permission',
        resourceId: 'permission-1',
        details: 'Granted permission Read on Customer',
        metadata: undefined,
      });
      expect(result).toEqual(mockAuditLog);
    });
  });

  describe('logRoleAssignment', () => {
    it('should log role assignment', async () => {
      auditLogRepository.create.mockReturnValue(mockAuditLog);
      auditLogRepository.save.mockResolvedValue(mockAuditLog);

      const result = await service.logRoleAssignment(
        AuditAction.ROLE_ASSIGNED,
        'user-1',
        'admin-1',
        'role-1',
        'tenant-1',
      );

      expect(auditLogRepository.create).toHaveBeenCalledWith({
        action: AuditAction.ROLE_ASSIGNED,
        result: AuditResult.SUCCESS,
        userId: 'user-1',
        actorId: 'admin-1',
        tenantId: 'tenant-1',
        roleId: 'role-1',
        resourceType: 'role',
        resourceId: 'role-1',
        details: 'Assigned role to user',
        metadata: undefined,
      });
      expect(result).toEqual(mockAuditLog);
    });
  });

  describe('queryAuditLogs', () => {
    it('should query audit logs with filters', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockAuditLog]),
      };

      auditLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.queryAuditLogs({
        userId: 'user-1',
        tenantId: 'tenant-1',
        action: AuditAction.ACCESS_GRANTED,
        limit: 10,
        offset: 0,
      });

      expect(auditLogRepository.createQueryBuilder).toHaveBeenCalledWith('audit_log');
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('audit_log.userId = :userId', { userId: 'user-1' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('audit_log.tenantId = :tenantId', { tenantId: 'tenant-1' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('audit_log.action = :action', { action: AuditAction.ACCESS_GRANTED });
      expect(result).toEqual({ logs: [mockAuditLog], total: 1 });
    });

    it('should handle date range filters', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      auditLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-12-31');

      await service.queryAuditLogs({
        startDate,
        endDate,
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'audit_log.createdAt BETWEEN :startDate AND :endDate',
        { startDate, endDate },
      );
    });
  });

  describe('getFailedAccessAttempts', () => {
    it('should get failed access attempts for security monitoring', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(2),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockAuditLog, mockAuditLog]),
      };

      auditLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getFailedAccessAttempts('tenant-1', 24, 50);

      expect(result.total).toBe(2);
      expect(result.logs).toHaveLength(2);
    });
  });

  describe('getUserAuditLogs', () => {
    it('should get audit logs for a specific user', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(3),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockAuditLog, mockAuditLog, mockAuditLog]),
      };

      auditLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getUserAuditLogs('user-1', 'tenant-1', 50, 0);

      expect(result.total).toBe(3);
      expect(result.logs).toHaveLength(3);
    });

    it('should handle pagination correctly', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(100),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockAuditLog]),
      };

      auditLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.getUserAuditLogs('user-1', 'tenant-1', 10, 20);

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(20);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    });
  });

  describe('getRoleAuditLogs', () => {
    it('should get audit logs for a specific role', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(2),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockAuditLog, mockAuditLog]),
      };

      auditLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getRoleAuditLogs('role-1', 'tenant-1', 25, 5);

      expect(result.total).toBe(2);
      expect(result.logs).toHaveLength(2);
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(5);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(25);
    });
  });

  describe('getAuditLogsByDateRange', () => {
    it('should get audit logs within date range', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(5),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockAuditLog]),
      };

      auditLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-12-31');

      const result = await service.getAuditLogsByDateRange(startDate, endDate, 'tenant-1', 100, 0);

      expect(result.total).toBe(5);
      expect(result.logs).toHaveLength(1);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'audit_log.createdAt BETWEEN :startDate AND :endDate',
        { startDate, endDate },
      );
    });
  });

  describe('getPermissionChanges', () => {
    it('should get permission changes for compliance reporting', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockAuditLog]),
        getCount: jest.fn().mockResolvedValue(1),
      };

      auditLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getPermissionChanges('tenant-1', 30, 100);

      expect(result.total).toBe(1);
      expect(result.logs).toHaveLength(1);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('audit_log.action IN (:...actions)', {
        actions: [
          AuditAction.PERMISSION_GRANTED,
          AuditAction.PERMISSION_REVOKED,
          AuditAction.ROLE_ASSIGNED,
          AuditAction.ROLE_UNASSIGNED,
        ],
      });
    });

    it('should work without tenant filter', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
        getCount: jest.fn().mockResolvedValue(0),
      };

      auditLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getPermissionChanges(undefined, 7, 50);

      expect(result.total).toBe(0);
      expect(result.logs).toHaveLength(0);
      // Should not call andWhere for tenantId when undefined
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(1); // Only for date filter
    });
  });

  describe('getAuditStatistics', () => {
    it('should calculate audit statistics correctly', async () => {
      const mockLogs = [
        { ...mockAuditLog, action: AuditAction.ACCESS_GRANTED, result: AuditResult.SUCCESS, userId: 'user-1', createdAt: new Date('2023-06-01') },
        { ...mockAuditLog, action: AuditAction.ACCESS_DENIED, result: AuditResult.FAILURE, userId: 'user-2', createdAt: new Date('2023-06-01') },
        { ...mockAuditLog, action: AuditAction.PERMISSION_GRANTED, result: AuditResult.SUCCESS, userId: 'user-1', createdAt: new Date('2023-06-02') },
        { ...mockAuditLog, action: AuditAction.ACCESS_GRANTED, result: AuditResult.SUCCESS, userId: 'user-3', createdAt: new Date('2023-06-02') },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockLogs),
      };

      auditLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getAuditStatistics('tenant-1', 30);

      expect(result.totalLogs).toBe(4);
      expect(result.successfulActions).toBe(3);
      expect(result.failedActions).toBe(1);
      expect(result.actionBreakdown[AuditAction.ACCESS_GRANTED]).toBe(2);
      expect(result.actionBreakdown[AuditAction.ACCESS_DENIED]).toBe(1);
      expect(result.actionBreakdown[AuditAction.PERMISSION_GRANTED]).toBe(1);
      expect(result.userActivity['user-1']).toBe(2);
      expect(result.userActivity['user-2']).toBe(1);
      expect(result.userActivity['user-3']).toBe(1);
      expect(result.dailyActivity).toHaveLength(2);
      expect(result.dailyActivity[0]).toEqual({ date: '2023-06-01', count: 2 });
      expect(result.dailyActivity[1]).toEqual({ date: '2023-06-02', count: 2 });
    });
  });

  describe('searchAuditLogs', () => {
    it('should search audit logs by text content', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(2),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockAuditLog, mockAuditLog]),
      };

      auditLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.searchAuditLogs('permission denied', 'tenant-1', 50, 10);

      expect(result.total).toBe(2);
      expect(result.logs).toHaveLength(2);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        '(audit_log.details ILIKE :searchTerm OR audit_log.errorMessage ILIKE :searchTerm)',
        { searchTerm: '%permission denied%' },
      );
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(50);
    });

    it('should search without tenant filter', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      auditLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.searchAuditLogs('test search', undefined, 100, 0);

      expect(result.total).toBe(0);
      expect(result.logs).toHaveLength(0);
      // Should not call andWhere for tenantId when undefined
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalledWith(
        'audit_log.tenantId = :tenantId',
        expect.any(Object),
      );
    });
  });

  describe('getComplianceExport', () => {
    it('should export audit logs for compliance', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockAuditLog]),
      };

      auditLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-12-31');
      const actions = [AuditAction.PERMISSION_GRANTED, AuditAction.ROLE_ASSIGNED];

      const result = await service.getComplianceExport(startDate, endDate, 'tenant-1', actions);

      expect(result).toHaveLength(1);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'audit_log.createdAt BETWEEN :startDate AND :endDate',
        { startDate, endDate },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('audit_log.tenantId = :tenantId', { tenantId: 'tenant-1' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('audit_log.action IN (:...actions)', { actions });
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('audit_log.createdAt', 'ASC');
    });

    it('should export without action filter', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      auditLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-12-31');

      const result = await service.getComplianceExport(startDate, endDate, 'tenant-1');

      expect(result).toHaveLength(0);
      // Should not call andWhere for actions when undefined
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalledWith(
        'audit_log.action IN (:...actions)',
        expect.any(Object),
      );
    });
  });

  describe('getUserRecentActivity', () => {
    it('should get recent activity for a user', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockAuditLog]),
      };

      auditLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getUserRecentActivity('user-1', 'tenant-1', 12, 25);

      expect(result).toHaveLength(1);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        '(audit_log.userId = :userId OR audit_log.actorId = :userId)',
        { userId: 'user-1' },
      );
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(25);
    });
  });

  describe('getSuspiciousActivity', () => {
    it('should detect suspicious activity patterns', async () => {
      const mockFailedAttempts = [
        { userId: 'user-1', count: '7', lastAttempt: new Date() },
        { userId: 'user-2', count: '5', lastAttempt: new Date() },
      ];

      const mockPermissionChanges = [mockAuditLog];
      const mockCrossTenantAttempts = [mockAuditLog];

      // Mock for failed attempts query
      const mockFailedQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        having: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockFailedAttempts),
      };

      // Mock for permission changes query
      const mockPermissionQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockPermissionChanges),
      };

      // Mock for cross-tenant query
      const mockCrossTenantQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockCrossTenantAttempts),
      };

      auditLogRepository.createQueryBuilder
        .mockReturnValueOnce(mockFailedQueryBuilder)
        .mockReturnValueOnce(mockPermissionQueryBuilder)
        .mockReturnValueOnce(mockCrossTenantQueryBuilder);

      const result = await service.getSuspiciousActivity('tenant-1', 24);

      expect(result.multipleFailedAttempts).toEqual(mockFailedAttempts);
      expect(result.unusualPermissionChanges).toEqual(mockPermissionChanges);
      expect(result.crossTenantAttempts).toEqual(mockCrossTenantAttempts);

      // Verify failed attempts query
      expect(mockFailedQueryBuilder.where).toHaveBeenCalledWith('audit_log.action = :action', { action: AuditAction.ACCESS_DENIED });
      expect(mockFailedQueryBuilder.having).toHaveBeenCalledWith('COUNT(*) >= 5');

      // Verify permission changes query
      expect(mockPermissionQueryBuilder.where).toHaveBeenCalledWith('audit_log.action IN (:...actions)', {
        actions: [AuditAction.PERMISSION_GRANTED, AuditAction.PERMISSION_REVOKED],
      });

      // Verify cross-tenant query
      expect(mockCrossTenantQueryBuilder.where).toHaveBeenCalledWith('audit_log.action = :action', { action: AuditAction.ACCESS_DENIED });
      expect(mockCrossTenantQueryBuilder.andWhere).toHaveBeenCalledWith('audit_log.errorMessage ILIKE :error', { error: '%tenant%' });
    });
  });

  describe('Query Filter Combinations', () => {
    it('should handle multiple filters correctly', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockAuditLog]),
      };

      auditLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const options = {
        userId: 'user-1',
        actorId: 'actor-1',
        tenantId: 'tenant-1',
        action: AuditAction.PERMISSION_GRANTED,
        result: AuditResult.SUCCESS,
        resourceType: 'permission',
        entityType: 'Customer',
        roleId: 'role-1',
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31'),
        limit: 25,
        offset: 10,
      };

      const result = await service.queryAuditLogs(options);

      expect(result.total).toBe(1);
      expect(result.logs).toHaveLength(1);

      // Verify all filters are applied
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('audit_log.userId = :userId', { userId: 'user-1' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('audit_log.actorId = :actorId', { actorId: 'actor-1' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('audit_log.tenantId = :tenantId', { tenantId: 'tenant-1' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('audit_log.action = :action', { action: AuditAction.PERMISSION_GRANTED });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('audit_log.result = :result', { result: AuditResult.SUCCESS });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('audit_log.resourceType = :resourceType', { resourceType: 'permission' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('audit_log.entityType = :entityType', { entityType: 'Customer' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('audit_log.roleId = :roleId', { roleId: 'role-1' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('audit_log.createdAt BETWEEN :startDate AND :endDate', {
        startDate: options.startDate,
        endDate: options.endDate,
      });

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(25);
    });

    it('should handle partial date filters', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      auditLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      // Test with only startDate
      await service.queryAuditLogs({ startDate: new Date('2023-01-01') });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('audit_log.createdAt >= :startDate', { startDate: new Date('2023-01-01') });

      // Reset mock
      mockQueryBuilder.andWhere.mockClear();

      // Test with only endDate
      await service.queryAuditLogs({ endDate: new Date('2023-12-31') });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('audit_log.createdAt <= :endDate', { endDate: new Date('2023-12-31') });
    });

    it('should handle empty query options', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      auditLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.queryAuditLogs({});

      expect(result.total).toBe(0);
      expect(result.logs).toHaveLength(0);
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(100); // Default limit
    });
  });

  describe('Data Integrity Tests', () => {
    it('should maintain data consistency in query results', async () => {
      const consistentAuditLog = {
        ...mockAuditLog,
        id: 'audit-123',
        userId: 'user-123',
        tenantId: 'tenant-123',
        action: AuditAction.PERMISSION_GRANTED,
        result: AuditResult.SUCCESS,
        createdAt: new Date('2023-06-15T10:30:00Z'),
      };

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([consistentAuditLog]),
      };

      auditLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.queryAuditLogs({
        userId: 'user-123',
        tenantId: 'tenant-123',
      });

      expect(result.logs[0]).toEqual(consistentAuditLog);
      expect(result.logs[0].userId).toBe('user-123');
      expect(result.logs[0].tenantId).toBe('tenant-123');
      expect(result.logs[0].id).toBe('audit-123');
    });

    it('should handle null and undefined values correctly', async () => {
      const auditLogWithNulls = {
        ...mockAuditLog,
        userId: null,
        actorId: null,
        roleId: null,
        permissionId: null,
        errorMessage: null,
        ipAddress: null,
        userAgent: null,
        metadata: null,
      };

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([auditLogWithNulls]),
      };

      auditLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.queryAuditLogs({});

      expect(result.logs[0]).toEqual(auditLogWithNulls);
      expect(result.logs[0].userId).toBeNull();
      expect(result.logs[0].metadata).toBeNull();
    });

    it('should preserve metadata structure', async () => {
      const complexMetadata = {
        requestId: 'req-123',
        sessionId: 'sess-456',
        clientInfo: {
          browser: 'Chrome',
          version: '91.0',
          os: 'Windows',
        },
        customFields: ['field1', 'field2'],
        timestamp: '2023-06-15T10:30:00Z',
      };

      const auditLogWithMetadata = {
        ...mockAuditLog,
        metadata: complexMetadata,
      };

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([auditLogWithMetadata]),
      };

      auditLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.queryAuditLogs({});

      expect(result.logs[0].metadata).toEqual(complexMetadata);
      expect(result.logs[0].metadata.clientInfo.browser).toBe('Chrome');
      expect(result.logs[0].metadata.customFields).toEqual(['field1', 'field2']);
    });
  });
});