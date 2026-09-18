import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CustomerActivity, CustomerActivityStatus, CustomerActivityType } from '../../../entities/customers/customer-activity.entity';
import { User } from '../../../entities/users/user.entity';
import { CrmAttentionFilter, CrmReportPeriod } from '../dto/query-crm-activity.dto';
import { CrmInboxService } from './crm-inbox.service';

describe('CrmInboxService', () => {
  let service: CrmInboxService;
  let activityRepo: {
    createQueryBuilder: jest.Mock;
    findOne: jest.Mock;
  };
  let userRepo: { findOne: jest.Mock };

  const tenantId = 'tenant-1';
  const actorId = 'user-actor';

  function mockQb(result: { count?: number; many?: unknown[]; raw?: unknown[] } = {}) {
    const qb: Record<string, jest.Mock> = {};
    const self = () => qb;
    [
      'leftJoinAndSelect',
      'innerJoin',
      'where',
      'andWhere',
      'orderBy',
      'addOrderBy',
      'select',
      'addSelect',
      'groupBy',
      'addGroupBy',
      'skip',
      'take',
    ].forEach((method) => {
      qb[method] = jest.fn().mockImplementation(self);
    });
    qb.clone = jest.fn().mockImplementation(() => mockQb(result));
    qb.getCount = jest.fn().mockResolvedValue(result.count ?? 0);
    qb.getMany = jest.fn().mockResolvedValue(result.many ?? []);
    qb.getRawMany = jest.fn().mockResolvedValue(result.raw ?? []);
    return qb;
  }

  beforeEach(async () => {
    activityRepo = {
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
    };
    userRepo = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrmInboxService,
        { provide: getRepositoryToken(CustomerActivity), useValue: activityRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
      ],
    }).compile();

    service = module.get(CrmInboxService);
  });

  describe('resolveDateRange', () => {
    it('resuelve mes actual hasta hoy', () => {
      const { dateFrom, dateTo } = service.resolveDateRange(CrmReportPeriod.MONTH);
      const now = new Date();
      expect(dateFrom.getDate()).toBe(1);
      expect(dateFrom.getMonth()).toBe(now.getMonth());
      expect(dateTo.getDate()).toBe(now.getDate());
    });

    it('resuelve rango explícito', () => {
      const { dateFrom, dateTo } = service.resolveDateRange(
        CrmReportPeriod.RANGE,
        '2026-09-01',
        '2026-09-10',
      );
      expect(dateFrom.getFullYear()).toBe(2026);
      expect(dateFrom.getMonth()).toBe(8);
      expect(dateFrom.getDate()).toBe(1);
      expect(dateTo.getDate()).toBe(10);
      expect(dateTo.getHours()).toBe(23);
    });
  });

  describe('list', () => {
    it('fuerza el alcance al usuario actual si no es admin CRM', async () => {
      userRepo.findOne.mockResolvedValue({ id: actorId, is_crm_admin: false });
      const qb = mockQb({ count: 0, many: [] });
      activityRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.list(tenantId, actorId, false, {
        period: CrmReportPeriod.MONTH,
      });

      expect(result.is_crm_admin).toBe(false);
      expect(qb.andWhere).toHaveBeenCalledWith(
        'activity.user_id = :scopeUserId',
        { scopeUserId: actorId },
      );
    });

    it('rechaza filtrar por otro usuario si no es admin CRM', async () => {
      userRepo.findOne.mockResolvedValue({ id: actorId, is_crm_admin: false });

      await expect(
        service.list(tenantId, actorId, false, { user_id: 'other-user' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('admin CRM puede listar sin recortar por autor', async () => {
      const qb = mockQb({ count: 1, many: [] });
      activityRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.list(tenantId, actorId, true, {
        period: CrmReportPeriod.TODAY,
      });

      expect(result.is_crm_admin).toBe(true);
      expect(qb.andWhere).not.toHaveBeenCalledWith(
        'activity.user_id = :scopeUserId',
        expect.anything(),
      );
    });

    it('marca seguimiento vencido', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const qb = mockQb({
        count: 1,
        many: [
          {
            id: 'act-1',
            customer_id: 9,
            customer: { id: 9, name: 'Ana', lastname: 'López', company_name: null },
            user_id: actorId,
            user: { id: actorId, first_name: 'Carlos', last_name: 'Ruiz', email: 'c@x.mx' },
            type: CustomerActivityType.CALL,
            status: CustomerActivityStatus.SCHEDULED,
            title: 'Llamar',
            description: null,
            notes: 'tarde',
            activity_date: new Date(),
            follow_up_date: yesterday,
            duration_minutes: 10,
            outcome: null,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
      });
      activityRepo.createQueryBuilder.mockReturnValue(qb);
      userRepo.findOne.mockResolvedValue({ id: actorId, is_crm_admin: true });

      const result = await service.list(tenantId, actorId, false, {
        attention: CrmAttentionFilter.FOLLOW_UP_OVERDUE,
      });

      expect(result.activities[0].is_overdue_follow_up).toBe(true);
      expect(result.activities[0].customer?.display_name).toBe('Ana López');
      expect(result.activities[0].user?.display_name).toBe('Carlos Ruiz');
    });
  });

  describe('listForExport', () => {
    it('devuelve todas las filas sin paginar y con etiqueta de periodo', async () => {
      const qb = mockQb({
        many: [
          {
            id: 'act-1',
            customer_id: 9,
            customer: { id: 9, name: 'Ana', lastname: 'López', company_name: null },
            user_id: actorId,
            user: { id: actorId, first_name: 'Carlos', last_name: 'Ruiz', email: 'c@x.mx' },
            type: CustomerActivityType.NOTE,
            status: CustomerActivityStatus.COMPLETED,
            title: 'Nota',
            description: null,
            notes: null,
            activity_date: new Date(),
            follow_up_date: null,
            duration_minutes: null,
            outcome: null,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
      });
      activityRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.listForExport(tenantId, actorId, true, {
        period: CrmReportPeriod.MONTH,
      });

      expect(qb.take).toHaveBeenCalledWith(20000);
      expect(qb.skip).not.toHaveBeenCalled();
      expect(result.activities).toHaveLength(1);
      expect(result.period_label).toBe('Mes');
      expect(result.is_crm_admin).toBe(true);
    });
  });

  describe('authors', () => {
    it('si no es admin CRM solo lista al usuario actual si ya creó actividades', async () => {
      userRepo.findOne.mockResolvedValue({ id: actorId, is_crm_admin: false });
      const qb = mockQb({
        raw: [
          {
            id: actorId,
            first_name: 'Ana',
            last_name: 'Pérez',
            email: 'ana@x.mx',
            activity_count: '3',
          },
        ],
      });
      activityRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.authors(tenantId, actorId, false);

      expect(result.is_crm_admin).toBe(false);
      expect(qb.andWhere).toHaveBeenCalledWith('activity.user_id = :actorUserId', {
        actorUserId: actorId,
      });
      expect(result.authors).toEqual([
        {
          id: actorId,
          first_name: 'Ana',
          last_name: 'Pérez',
          email: 'ana@x.mx',
          display_name: 'Ana Pérez',
          activity_count: 3,
        },
      ]);
    });

    it('lista solo usuarios con actividades', async () => {
      const qb = mockQb({
        raw: [
          {
            id: 'u-1',
            first_name: 'Carlos',
            last_name: 'Ruiz',
            email: 'c@x.mx',
            activity_count: '4',
          },
        ],
      });
      activityRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.authors(tenantId, actorId, true);

      expect(result.is_crm_admin).toBe(true);
      expect(result.authors).toEqual([
        {
          id: 'u-1',
          first_name: 'Carlos',
          last_name: 'Ruiz',
          email: 'c@x.mx',
          display_name: 'Carlos Ruiz',
          activity_count: 4,
        },
      ]);
    });
  });
});
