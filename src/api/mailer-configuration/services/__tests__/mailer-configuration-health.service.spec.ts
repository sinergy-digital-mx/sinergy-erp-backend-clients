import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { MailerConfigurationHealthService } from '../mailer-configuration-health.service';
import { MailerConfigurationHealth } from '../../../../entities/mailer-configuration/mailer-configuration-health.entity';

describe('MailerConfigurationHealthService', () => {
  let service: MailerConfigurationHealthService;
  let mockRepository: jest.Mocked<Repository<MailerConfigurationHealth>>;

  const mockHealth: MailerConfigurationHealth = {
    id: 'health-123',
    configurationId: 'config-123',
    tenantId: 'tenant-123',
    lastTestResult: 'SUCCESS',
    lastTestTimestamp: new Date(),
    lastTestError: null,
    lastUsedTimestamp: new Date(),
    consecutiveFailures: 0,
    isHealthy: true,
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailerConfigurationHealthService,
        {
          provide: 'MailerConfigurationHealthRepository',
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<MailerConfigurationHealthService>(
      MailerConfigurationHealthService,
    );
  });

  describe('recordTestResult', () => {
    it('should record successful test result', async () => {
      mockRepository.findOne.mockResolvedValue(mockHealth);
      mockRepository.save.mockResolvedValue({
        ...mockHealth,
        lastTestResult: 'SUCCESS',
        consecutiveFailures: 0,
      });

      await service.recordTestResult('config-123', {
        success: true,
      });

      expect(mockRepository.save).toHaveBeenCalled();
      const savedData = mockRepository.save.mock.calls[0][0];
      expect(savedData.lastTestResult).toBe('SUCCESS');
      expect(savedData.consecutiveFailures).toBe(0);
    });

    it('should record failed test result', async () => {
      mockRepository.findOne.mockResolvedValue(mockHealth);
      mockRepository.save.mockResolvedValue({
        ...mockHealth,
        lastTestResult: 'FAILURE',
        consecutiveFailures: 1,
      });

      await service.recordTestResult('config-123', {
        success: false,
        error: 'Connection failed',
      });

      expect(mockRepository.save).toHaveBeenCalled();
      const savedData = mockRepository.save.mock.calls[0][0];
      expect(savedData.lastTestResult).toBe('FAILURE');
      expect(savedData.consecutiveFailures).toBeGreaterThan(0);
    });

    it('should increment consecutive failures on repeated failures', async () => {
      const healthWithFailures = {
        ...mockHealth,
        lastTestResult: 'FAILURE',
        consecutiveFailures: 2,
      };

      mockRepository.findOne.mockResolvedValue(healthWithFailures);
      mockRepository.save.mockResolvedValue({
        ...healthWithFailures,
        consecutiveFailures: 3,
      });

      await service.recordTestResult('config-123', {
        success: false,
        error: 'Connection failed',
      });

      const savedData = mockRepository.save.mock.calls[0][0];
      expect(savedData.consecutiveFailures).toBe(3);
    });

    it('should reset consecutive failures on success', async () => {
      const healthWithFailures = {
        ...mockHealth,
        lastTestResult: 'FAILURE',
        consecutiveFailures: 3,
      };

      mockRepository.findOne.mockResolvedValue(healthWithFailures);
      mockRepository.save.mockResolvedValue({
        ...healthWithFailures,
        lastTestResult: 'SUCCESS',
        consecutiveFailures: 0,
      });

      await service.recordTestResult('config-123', {
        success: true,
      });

      const savedData = mockRepository.save.mock.calls[0][0];
      expect(savedData.consecutiveFailures).toBe(0);
    });

    it('should create health record if not exists', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockHealth);
      mockRepository.save.mockResolvedValue(mockHealth);

      await service.recordTestResult('config-123', {
        success: true,
      });

      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should store error message on failure', async () => {
      mockRepository.findOne.mockResolvedValue(mockHealth);
      mockRepository.save.mockResolvedValue({
        ...mockHealth,
        lastTestResult: 'FAILURE',
        lastTestError: 'Invalid API key',
      });

      await service.recordTestResult('config-123', {
        success: false,
        error: 'Invalid API key',
      });

      const savedData = mockRepository.save.mock.calls[0][0];
      expect(savedData.lastTestError).toBe('Invalid API key');
    });
  });

  describe('recordUsage', () => {
    it('should update last used timestamp', async () => {
      mockRepository.findOne.mockResolvedValue(mockHealth);
      mockRepository.save.mockResolvedValue({
        ...mockHealth,
        lastUsedTimestamp: new Date(),
      });

      await service.recordUsage('config-123');

      expect(mockRepository.save).toHaveBeenCalled();
      const savedData = mockRepository.save.mock.calls[0][0];
      expect(savedData.lastUsedTimestamp).toBeDefined();
    });

    it('should create health record if not exists', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockHealth);
      mockRepository.save.mockResolvedValue(mockHealth);

      await service.recordUsage('config-123');

      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('getHealth', () => {
    it('should retrieve health status', async () => {
      mockRepository.findOne.mockResolvedValue(mockHealth);

      const result = await service.getHealth('config-123');

      expect(result).toEqual(mockHealth);
    });

    it('should return null if health record not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.getHealth('config-123');

      expect(result).toBeNull();
    });

    it('should include all health metrics', async () => {
      mockRepository.findOne.mockResolvedValue(mockHealth);

      const result = await service.getHealth('config-123');

      expect(result).toHaveProperty('lastTestResult');
      expect(result).toHaveProperty('lastTestTimestamp');
      expect(result).toHaveProperty('lastUsedTimestamp');
      expect(result).toHaveProperty('consecutiveFailures');
      expect(result).toHaveProperty('isHealthy');
    });
  });

  describe('markUnhealthy', () => {
    it('should mark configuration as unhealthy', async () => {
      mockRepository.findOne.mockResolvedValue(mockHealth);
      mockRepository.save.mockResolvedValue({
        ...mockHealth,
        isHealthy: false,
      });

      await service.markUnhealthy('config-123', 'Too many failures');

      expect(mockRepository.save).toHaveBeenCalled();
      const savedData = mockRepository.save.mock.calls[0][0];
      expect(savedData.isHealthy).toBe(false);
    });

    it('should store unhealthy reason', async () => {
      mockRepository.findOne.mockResolvedValue(mockHealth);
      mockRepository.save.mockResolvedValue({
        ...mockHealth,
        isHealthy: false,
        lastTestError: 'Too many failures',
      });

      await service.markUnhealthy('config-123', 'Too many failures');

      const savedData = mockRepository.save.mock.calls[0][0];
      expect(savedData.lastTestError).toBe('Too many failures');
    });

    it('should create health record if not exists', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockHealth);
      mockRepository.save.mockResolvedValue(mockHealth);

      await service.markUnhealthy('config-123', 'Reason');

      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('Health status calculation', () => {
    it('should mark as unhealthy after threshold failures', async () => {
      const healthWithManyFailures = {
        ...mockHealth,
        consecutiveFailures: 5,
      };

      mockRepository.findOne.mockResolvedValue(healthWithManyFailures);
      mockRepository.save.mockResolvedValue({
        ...healthWithManyFailures,
        isHealthy: false,
      });

      await service.recordTestResult('config-123', {
        success: false,
        error: 'Connection failed',
      });

      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should mark as healthy after successful test', async () => {
      const unhealthyConfig = {
        ...mockHealth,
        isHealthy: false,
        consecutiveFailures: 3,
      };

      mockRepository.findOne.mockResolvedValue(unhealthyConfig);
      mockRepository.save.mockResolvedValue({
        ...unhealthyConfig,
        isHealthy: true,
        consecutiveFailures: 0,
      });

      await service.recordTestResult('config-123', {
        success: true,
      });

      const savedData = mockRepository.save.mock.calls[0][0];
      expect(savedData.isHealthy).toBe(true);
    });
  });

  describe('Untested configuration status', () => {
    it('should indicate untested status for new configuration', async () => {
      const untestedHealth = {
        ...mockHealth,
        lastTestResult: 'UNTESTED',
        lastTestTimestamp: null,
      };

      mockRepository.findOne.mockResolvedValue(untestedHealth);

      const result = await service.getHealth('config-123');

      expect(result.lastTestResult).toBe('UNTESTED');
      expect(result.lastTestTimestamp).toBeNull();
    });
  });

  describe('Unused configuration status', () => {
    it('should indicate unused status for new configuration', async () => {
      const unusedHealth = {
        ...mockHealth,
        lastUsedTimestamp: null,
      };

      mockRepository.findOne.mockResolvedValue(unusedHealth);

      const result = await service.getHealth('config-123');

      expect(result.lastUsedTimestamp).toBeNull();
    });
  });
});
