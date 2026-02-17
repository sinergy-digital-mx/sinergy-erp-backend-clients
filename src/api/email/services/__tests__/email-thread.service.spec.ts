import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailThreadService } from '../email-thread.service';
import { EmailThread } from '../../../../entities/email/email-thread.entity';
import { EmailMessage } from '../../../../entities/email/email-message.entity';
import { Lead } from '../../../../entities/leads/lead.entity';
import { NotFoundException } from '@nestjs/common';

describe('EmailThreadService', () => {
  let service: EmailThreadService;
  let threadRepo: Repository<EmailThread>;
  let messageRepo: Repository<EmailMessage>;
  let leadRepo: Repository<Lead>;

  const mockTenantId = 'tenant-123';
  const mockUserId = 'user-123';
  const mockThreadId = 'thread-123';
  const mockLeadId = 'lead-123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailThreadService,
        {
          provide: getRepositoryToken(EmailThread),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(EmailMessage),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Lead),
          useValue: {
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EmailThreadService>(EmailThreadService);
    threadRepo = module.get<Repository<EmailThread>>(getRepositoryToken(EmailThread));
    messageRepo = module.get<Repository<EmailMessage>>(getRepositoryToken(EmailMessage));
    leadRepo = module.get<Repository<Lead>>(getRepositoryToken(Lead));
  });

  describe('createThread', () => {
    it('should create a new thread with initial message', async () => {
      const mockThread = {
        id: mockThreadId,
        tenant_id: mockTenantId,
        entity_type: 'lead',
        entity_id: mockLeadId,
        subject: 'Test Subject',
        email_from: 'noreply@example.com',
        email_to: 'test@example.com',
        status: 'draft',
        created_by: mockUserId,
      };

      const mockMessage = {
        id: 'msg-123',
        tenant_id: mockTenantId,
        thread_id: mockThreadId,
        message_id: 'msg-id-123',
        from_email: 'noreply@example.com',
        to_email: 'test@example.com',
        subject: 'Test Subject',
        body: 'Test body',
        direction: 'outbound',
        status: 'pending',
      };

      jest.spyOn(threadRepo, 'create').mockReturnValue(mockThread as any);
      jest.spyOn(threadRepo, 'save').mockResolvedValue(mockThread as any);
      jest.spyOn(messageRepo, 'create').mockReturnValue(mockMessage as any);
      jest.spyOn(messageRepo, 'save').mockResolvedValue(mockMessage as any);
      jest.spyOn(leadRepo, 'update').mockResolvedValue({ affected: 1 } as any);

      const result = await service.createThread(
        mockTenantId,
        'lead',
        mockLeadId,
        'test@example.com',
        'Test Subject',
        'Test body',
        mockUserId,
      );

      expect(result.thread).toEqual(mockThread);
      expect(result.message).toEqual(mockMessage);
      expect(leadRepo.update).toHaveBeenCalledWith(mockLeadId, expect.objectContaining({
        email_contacted: true,
        assigned_rep_id: mockUserId,
      }));
    });
  });

  describe('getThreadsByEntity', () => {
    it('should return threads for an entity', async () => {
      const mockThreads = [
        {
          id: mockThreadId,
          tenant_id: mockTenantId,
          entity_type: 'lead',
          entity_id: mockLeadId,
          messages: [],
        },
      ];

      jest.spyOn(threadRepo, 'find').mockResolvedValue(mockThreads as any);

      const result = await service.getThreadsByEntity(mockTenantId, 'lead', mockLeadId);

      expect(result).toEqual(mockThreads);
      expect(threadRepo.find).toHaveBeenCalledWith({
        where: {
          tenant_id: mockTenantId,
          entity_type: 'lead',
          entity_id: mockLeadId,
        },
        order: { last_message_at: 'DESC' },
        relations: ['messages'],
      });
    });
  });

  describe('getThreadDetails', () => {
    it('should return thread details with messages', async () => {
      const mockThread = {
        id: mockThreadId,
        tenant_id: mockTenantId,
        messages: [
          { id: 'msg-1', created_at: new Date('2026-01-01') },
          { id: 'msg-2', created_at: new Date('2026-01-02') },
        ],
      };

      jest.spyOn(threadRepo, 'findOne').mockResolvedValue(mockThread as any);

      const result = await service.getThreadDetails(mockTenantId, mockThreadId);

      expect(result).toEqual(mockThread);
      expect(result.messages[0].id).toBe('msg-1');
      expect(result.messages[1].id).toBe('msg-2');
    });

    it('should throw NotFoundException if thread not found', async () => {
      jest.spyOn(threadRepo, 'findOne').mockResolvedValue(null);

      await expect(
        service.getThreadDetails(mockTenantId, mockThreadId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateThreadStatus', () => {
    it('should update thread status', async () => {
      const mockThread = {
        id: mockThreadId,
        tenant_id: mockTenantId,
        status: 'draft',
      };

      jest.spyOn(threadRepo, 'findOne').mockResolvedValue(mockThread as any);
      jest.spyOn(threadRepo, 'save').mockResolvedValue({ ...mockThread, status: 'archived' } as any);

      const result = await service.updateThreadStatus(mockTenantId, mockThreadId, 'archived');

      expect(result.status).toBe('archived');
    });
  });

  describe('markThreadAsRead', () => {
    it('should mark thread as read', async () => {
      const mockThread = {
        id: mockThreadId,
        tenant_id: mockTenantId,
        is_read: false,
      };

      jest.spyOn(threadRepo, 'findOne').mockResolvedValue(mockThread as any);
      jest.spyOn(threadRepo, 'save').mockResolvedValue({ ...mockThread, is_read: true } as any);

      const result = await service.markThreadAsRead(mockTenantId, mockThreadId);

      expect(result.is_read).toBe(true);
    });
  });

  describe('getAllThreads', () => {
    it('should return all threads with filters', async () => {
      const mockThreads = [
        { id: mockThreadId, tenant_id: mockTenantId, status: 'sent' },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockThreads),
      };

      jest.spyOn(threadRepo, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.getAllThreads(mockTenantId, { status: 'sent' });

      expect(result).toEqual(mockThreads);
    });
  });
});
