import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, Repository } from 'typeorm';
import { AuditService } from '../audit.service';
import { MailerConfigurationAudit, MailerConfigurationAuditAction } from '../../../../entities/mailer-configuration/mailer-configuration-audit.entity';

describe('AuditService', () => {
  let service: AuditService;
  let mockRepository: jest.Mocked<Repository<MailerConfigurationAudit>>;
  let mockDataSource: jest.Mocked<DataSource>;

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as any;

    mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockRepository),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  describe('recordAuditEvent', () => {
    it('should create and save an audit record', async () => {
      const configId = 'config-123';
      const tenantId = 'tenant-123';
      const userId = 'user-123';
      const mockAuditRecord = {
        id: 'audit-123',
        configuration_id: configId,
        tenant_id: tenantId,
        action: MailerConfigurationAuditAction.CREATE,
        performed_by: userId,
        performed_at: new Date(),
        details: 'Created new configuration',
        changed_fields: null,
      };

      mockRepository.create.mockReturnValue(mockAuditRecord as any);
      mockRepository.save.mockResolvedValue(mockAuditRecord as any);

      const result = await service.recordAuditEvent(
        configId,
        tenantId,
        MailerConfigurationAuditAction.CREATE,
        userId,
        'Created new configuration',
      );

      expect(mockRepository.create).toHaveBeenCalledWith({
        configuration_id: configId,
        tenant_id: tenantId,
        action: MailerConfigurationAuditAction.CREATE,
        performed_by: userId,
        performed_at: expect.any(Date),
        details: 'Created new configuration',
        changed_fields: null,
      });

      expect(mockRepository.save).toHaveBeenCalledWith(mockAuditRecord);
      expect(result).toEqual(mockAuditRecord);
    });

    it('should record audit event with changed fields', async () => {
      const configId = 'config-123';
      const tenantId = 'tenant-123';
      const userId = 'user-123';
      const changedFields = {
        name: { oldValue: 'Old Name', newValue: 'New Name' },
        is_active: { oldValue: false, newValue: true },
      };

      const mockAuditRecord = {
        id: 'audit-123',
        configuration_id: configId,
        tenant_id: tenantId,
        action: MailerConfigurationAuditAction.UPDATE,
        performed_by: userId,
        performed_at: new Date(),
        details: null,
        changed_fields: changedFields,
      };

      mockRepository.create.mockReturnValue(mockAuditRecord as any);
      mockRepository.save.mockResolvedValue(mockAuditRecord as any);

      const result = await service.recordAuditEvent(
        configId,
        tenantId,
        MailerConfigurationAuditAction.UPDATE,
        userId,
        undefined,
        changedFields,
      );

      expect(mockRepository.create).toHaveBeenCalledWith({
        configuration_id: configId,
        tenant_id: tenantId,
        action: MailerConfigurationAuditAction.UPDATE,
        performed_by: userId,
        performed_at: expect.any(Date),
        details: null,
        changed_fields: changedFields,
      });

      expect(result.changed_fields).toEqual(changedFields);
    });
  });

  describe('getConfigurationAuditTrail', () => {
    it('should retrieve audit records for a configuration', async () => {
      const configId = 'config-123';
      const mockRecords = [
        {
          id: 'audit-1',
          configuration_id: configId,
          action: MailerConfigurationAuditAction.CREATE,
          performed_at: new Date(),
        },
        {
          id: 'audit-2',
          configuration_id: configId,
          action: MailerConfigurationAuditAction.UPDATE,
          performed_at: new Date(),
        },
      ];

      mockRepository.find.mockResolvedValue(mockRecords as any);

      const result = await service.getConfigurationAuditTrail(configId, 50, 0);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { configuration_id: configId },
        order: { performed_at: 'DESC' },
        take: 50,
        skip: 0,
      });

      expect(result).toEqual(mockRecords);
    });

    it('should support pagination', async () => {
      const configId = 'config-123';
      mockRepository.find.mockResolvedValue([]);

      await service.getConfigurationAuditTrail(configId, 25, 50);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { configuration_id: configId },
        order: { performed_at: 'DESC' },
        take: 25,
        skip: 50,
      });
    });
  });

  describe('getTenantAuditTrail', () => {
    it('should retrieve audit records for a tenant', async () => {
      const tenantId = 'tenant-123';
      const mockRecords = [
        {
          id: 'audit-1',
          tenant_id: tenantId,
          action: MailerConfigurationAuditAction.CREATE,
        },
      ];

      mockRepository.find.mockResolvedValue(mockRecords as any);

      const result = await service.getTenantAuditTrail(tenantId, 100, 0);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { tenant_id: tenantId },
        order: { performed_at: 'DESC' },
        take: 100,
        skip: 0,
      });

      expect(result).toEqual(mockRecords);
    });
  });

  describe('getAuditRecordsByAction', () => {
    it('should retrieve audit records filtered by action', async () => {
      const tenantId = 'tenant-123';
      const action = MailerConfigurationAuditAction.UPDATE;
      const mockRecords = [
        {
          id: 'audit-1',
          tenant_id: tenantId,
          action,
        },
      ];

      mockRepository.find.mockResolvedValue(mockRecords as any);

      const result = await service.getAuditRecordsByAction(tenantId, action, 50, 0);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { tenant_id: tenantId, action },
        order: { performed_at: 'DESC' },
        take: 50,
        skip: 0,
      });

      expect(result).toEqual(mockRecords);
    });
  });

  describe('getAuditRecordsByDateRange', () => {
    it('should retrieve audit records within date range', async () => {
      const tenantId = 'tenant-123';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const mockRecords = [
        {
          id: 'audit-1',
          tenant_id: tenantId,
          performed_at: new Date('2024-01-15'),
        },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockRecords),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.getAuditRecordsByDateRange(tenantId, startDate, endDate, 100, 0);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('audit');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('audit.tenant_id = :tenantId', { tenantId });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockRecords);
    });
  });

  describe('getAuditRecordsByUser', () => {
    it('should retrieve audit records for a specific user', async () => {
      const tenantId = 'tenant-123';
      const userId = 'user-123';
      const mockRecords = [
        {
          id: 'audit-1',
          tenant_id: tenantId,
          performed_by: userId,
        },
      ];

      mockRepository.find.mockResolvedValue(mockRecords as any);

      const result = await service.getAuditRecordsByUser(tenantId, userId, 50, 0);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { tenant_id: tenantId, performed_by: userId },
        order: { performed_at: 'DESC' },
        take: 50,
        skip: 0,
      });

      expect(result).toEqual(mockRecords);
    });
  });

  describe('getConfigurationAuditCount', () => {
    it('should return count of audit records for a configuration', async () => {
      const configId = 'config-123';
      mockRepository.count.mockResolvedValue(5);

      const result = await service.getConfigurationAuditCount(configId);

      expect(mockRepository.count).toHaveBeenCalledWith({
        where: { configuration_id: configId },
      });

      expect(result).toBe(5);
    });
  });

  describe('getTenantAuditCount', () => {
    it('should return count of audit records for a tenant', async () => {
      const tenantId = 'tenant-123';
      mockRepository.count.mockResolvedValue(42);

      const result = await service.getTenantAuditCount(tenantId);

      expect(mockRepository.count).toHaveBeenCalledWith({
        where: { tenant_id: tenantId },
      });

      expect(result).toBe(42);
    });
  });

  describe('getLatestAuditRecord', () => {
    it('should retrieve the most recent audit record', async () => {
      const configId = 'config-123';
      const mockRecord = {
        id: 'audit-1',
        configuration_id: configId,
        action: MailerConfigurationAuditAction.UPDATE,
        performed_at: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(mockRecord as any);

      const result = await service.getLatestAuditRecord(configId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { configuration_id: configId },
        order: { performed_at: 'DESC' },
      });

      expect(result).toEqual(mockRecord);
    });

    it('should return null if no audit record exists', async () => {
      const configId = 'config-123';
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.getLatestAuditRecord(configId);

      expect(result).toBeNull();
    });
  });

  describe('getAuditRecordsForConfigurations', () => {
    it('should retrieve audit records for multiple configurations', async () => {
      const configIds = ['config-1', 'config-2', 'config-3'];
      const mockRecords = [
        { id: 'audit-1', configuration_id: 'config-1' },
        { id: 'audit-2', configuration_id: 'config-2' },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockRecords),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.getAuditRecordsForConfigurations(configIds, 100);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('audit');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('audit.configuration_id IN (:...configurationIds)', {
        configurationIds: configIds,
      });
      expect(result).toEqual(mockRecords);
    });

    it('should return empty array for empty configuration IDs', async () => {
      const result = await service.getAuditRecordsForConfigurations([], 100);

      expect(result).toEqual([]);
      expect(mockRepository.createQueryBuilder).not.toHaveBeenCalled();
    });
  });

  describe('All audit actions', () => {
    it('should support all audit action types', async () => {
      const actions = [
        MailerConfigurationAuditAction.CREATE,
        MailerConfigurationAuditAction.UPDATE,
        MailerConfigurationAuditAction.DELETE,
        MailerConfigurationAuditAction.TEST,
        MailerConfigurationAuditAction.ACTIVATE,
        MailerConfigurationAuditAction.DEACTIVATE,
      ];

      for (const action of actions) {
        const mockRecord = {
          id: `audit-${action}`,
          action,
          configuration_id: 'config-123',
          tenant_id: 'tenant-123',
          performed_by: 'user-123',
          performed_at: new Date(),
        };

        mockRepository.create.mockReturnValue(mockRecord as any);
        mockRepository.save.mockResolvedValue(mockRecord as any);

        const result = await service.recordAuditEvent('config-123', 'tenant-123', action, 'user-123');

        expect(result.action).toBe(action);
      }
    });
  });
});
