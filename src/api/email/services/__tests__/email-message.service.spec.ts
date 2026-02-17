import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailMessageService } from '../email-message.service';
import { EmailMessage } from '../../../../entities/email/email-message.entity';
import { EmailThread } from '../../../../entities/email/email-thread.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('EmailMessageService', () => {
  let service: EmailMessageService;
  let messageRepo: Repository<EmailMessage>;
  let threadRepo: Repository<EmailThread>;

  const mockTenantId = 'tenant-123';
  const mockThreadId = 'thread-123';
  const mockMessageId = 'msg-123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailMessageService,
        {
          provide: getRepositoryToken(EmailMessage),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(EmailThread),
          useValue: {
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EmailMessageService>(EmailMessageService);
    messageRepo = module.get<Repository<EmailMessage>>(getRepositoryToken(EmailMessage));
    threadRepo = module.get<Repository<EmailThread>>(getRepositoryToken(EmailThread));
  });

  describe('sendMessage', () => {
    it('should send a message in a thread', async () => {
      const mockThread = {
        id: mockThreadId,
        tenant_id: mockTenantId,
      };

      const mockMessage = {
        id: mockMessageId,
        tenant_id: mockTenantId,
        thread_id: mockThreadId,
        direction: 'outbound',
        status: 'pending',
      };

      jest.spyOn(threadRepo, 'findOne').mockResolvedValue(mockThread as any);
      jest.spyOn(messageRepo, 'create').mockReturnValue(mockMessage as any);
      jest.spyOn(messageRepo, 'save').mockResolvedValue(mockMessage as any);
      jest.spyOn(threadRepo, 'update').mockResolvedValue({ affected: 1 } as any);

      const result = await service.sendMessage(
        mockTenantId,
        mockThreadId,
        'from@example.com',
        'to@example.com',
        'Subject',
        'Body',
      );

      expect(result).toEqual(mockMessage);
      expect(threadRepo.update).toHaveBeenCalledWith(mockThreadId, expect.any(Object));
    });

    it('should throw NotFoundException if thread not found', async () => {
      jest.spyOn(threadRepo, 'findOne').mockResolvedValue(null);

      await expect(
        service.sendMessage(
          mockTenantId,
          mockThreadId,
          'from@example.com',
          'to@example.com',
          'Subject',
          'Body',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('receiveMessage', () => {
    it('should receive a message in a thread', async () => {
      const mockThread = {
        id: mockThreadId,
        tenant_id: mockTenantId,
      };

      const mockMessage = {
        id: mockMessageId,
        tenant_id: mockTenantId,
        thread_id: mockThreadId,
        direction: 'inbound',
        status: 'received',
      };

      jest.spyOn(threadRepo, 'findOne').mockResolvedValue(mockThread as any);
      jest.spyOn(messageRepo, 'findOne').mockResolvedValue(null);
      jest.spyOn(messageRepo, 'create').mockReturnValue(mockMessage as any);
      jest.spyOn(messageRepo, 'save').mockResolvedValue(mockMessage as any);
      jest.spyOn(threadRepo, 'update').mockResolvedValue({ affected: 1 } as any);

      const result = await service.receiveMessage(
        mockTenantId,
        mockThreadId,
        'external-id-123',
        'from@example.com',
        'to@example.com',
        'Subject',
        'Body',
      );

      expect(result).toEqual(mockMessage);
      expect(result.direction).toBe('inbound');
    });

    it('should throw BadRequestException if message already exists', async () => {
      const mockThread = {
        id: mockThreadId,
        tenant_id: mockTenantId,
      };

      const existingMessage = {
        id: mockMessageId,
        external_id: 'external-id-123',
      };

      jest.spyOn(threadRepo, 'findOne').mockResolvedValue(mockThread as any);
      jest.spyOn(messageRepo, 'findOne').mockResolvedValue(existingMessage as any);

      await expect(
        service.receiveMessage(
          mockTenantId,
          mockThreadId,
          'external-id-123',
          'from@example.com',
          'to@example.com',
          'Subject',
          'Body',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getThreadMessages', () => {
    it('should return all messages in a thread', async () => {
      const mockThread = {
        id: mockThreadId,
        tenant_id: mockTenantId,
      };

      const mockMessages = [
        { id: 'msg-1', created_at: new Date('2026-01-01') },
        { id: 'msg-2', created_at: new Date('2026-01-02') },
      ];

      jest.spyOn(threadRepo, 'findOne').mockResolvedValue(mockThread as any);
      jest.spyOn(messageRepo, 'find').mockResolvedValue(mockMessages as any);

      const result = await service.getThreadMessages(mockTenantId, mockThreadId);

      expect(result).toEqual(mockMessages);
    });

    it('should throw NotFoundException if thread not found', async () => {
      jest.spyOn(threadRepo, 'findOne').mockResolvedValue(null);

      await expect(
        service.getThreadMessages(mockTenantId, mockThreadId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('markAsRead', () => {
    it('should mark message as read', async () => {
      const mockMessage = {
        id: mockMessageId,
        tenant_id: mockTenantId,
        read_at: null,
      };

      jest.spyOn(messageRepo, 'findOne').mockResolvedValue(mockMessage as any);
      jest.spyOn(messageRepo, 'save').mockResolvedValue({ ...mockMessage, read_at: new Date() } as any);

      const result = await service.markAsRead(mockTenantId, mockMessageId);

      expect(result.read_at).not.toBeNull();
    });
  });

  describe('markThreadMessagesAsRead', () => {
    it('should mark all messages in thread as read', async () => {
      jest.spyOn(messageRepo, 'update').mockResolvedValue({ affected: 2 } as any);

      await service.markThreadMessagesAsRead(mockTenantId, mockThreadId);

      expect(messageRepo.update).toHaveBeenCalledWith(
        { thread_id: mockThreadId, tenant_id: mockTenantId },
        { read_at: expect.any(Date) },
      );
    });
  });

  describe('getMessageById', () => {
    it('should return message by ID', async () => {
      const mockMessage = {
        id: mockMessageId,
        tenant_id: mockTenantId,
      };

      jest.spyOn(messageRepo, 'findOne').mockResolvedValue(mockMessage as any);

      const result = await service.getMessageById(mockTenantId, mockMessageId);

      expect(result).toEqual(mockMessage);
    });

    it('should throw NotFoundException if message not found', async () => {
      jest.spyOn(messageRepo, 'findOne').mockResolvedValue(null);

      await expect(
        service.getMessageById(mockTenantId, mockMessageId),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
