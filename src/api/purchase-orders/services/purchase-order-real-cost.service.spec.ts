import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PurchaseOrderBatch } from '../../../entities/purchase-orders/purchase-order-batch.entity';
import { PurchaseOrderBatchDetail } from '../../../entities/purchase-orders/purchase-order-batch-detail.entity';
import { PurchaseOrderLandedCostLine } from '../../../entities/purchase-orders/purchase-order-landed-cost-line.entity';
import { PurchaseOrderActivityService } from './purchase-order-activity.service';
import { PurchaseOrderRealCostService } from './purchase-order-real-cost.service';

describe('PurchaseOrderRealCostService', () => {
  let service: PurchaseOrderRealCostService;
  let poRepo: any;
  let lineRepo: any;
  let extraRepo: any;

  const po = {
    id: 'po-1',
    tenant_id: 't1',
    general_status: 'Creada',
    payment_currency: 'USD',
    customs_date: null,
    customs_exchange_rate: null,
    landed_cost_lines: [],
    line_items: [
      {
        id: 'line-1',
        quantity: 4900,
        unit_total: 1.8,
        received_original_quantity: null,
        received_original_unit_total: null,
        igi_percentage: 0,
      },
    ],
  };

  beforeEach(async () => {
    poRepo = {
      findOne: jest.fn().mockResolvedValue({ ...po, line_items: [...po.line_items] }),
      save: jest.fn().mockImplementation(async (entity) => entity),
      update: jest.fn().mockResolvedValue(undefined),
    };
    lineRepo = {
      save: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
    };
    extraRepo = {
      delete: jest.fn().mockResolvedValue(undefined),
      create: jest.fn().mockImplementation((value) => value),
      save: jest.fn().mockResolvedValue(undefined),
    };

    const module = await Test.createTestingModule({
      providers: [
        PurchaseOrderRealCostService,
        { provide: getRepositoryToken(PurchaseOrderBatch), useValue: poRepo },
        { provide: getRepositoryToken(PurchaseOrderBatchDetail), useValue: lineRepo },
        { provide: getRepositoryToken(PurchaseOrderLandedCostLine), useValue: extraRepo },
        {
          provide: PurchaseOrderActivityService,
          useValue: { record: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = module.get(PurchaseOrderRealCostService);
  });

  it('reemplaza gastos libres (se pueden agregar o quitar)', async () => {
    poRepo.findOne.mockResolvedValue({
      ...po,
      customs_exchange_rate: 16.9593,
      landed_cost_lines: [
        { concept: 'Honorarios', amount: 2800, currency: 'MXN', sort_order: 0 },
        { concept: 'Maniobra nueva', amount: 500, currency: 'MXN', sort_order: 1 },
      ],
      line_items: [...po.line_items],
    });

    await service.updateRealCost(
      'po-1',
      {
        customs_date: '2026-08-21',
        customs_exchange_rate: 16.9593,
        extra_costs: [
          { concept: 'Honorarios', amount: 2800, currency: 'MXN' },
          { concept: 'Maniobra nueva', amount: 500, currency: 'MXN' },
        ],
      },
      't1',
      'user-1',
    );

    expect(extraRepo.delete).toHaveBeenCalledWith({
      purchase_order_batch_id: 'po-1',
      tenant_id: 't1',
    });
    expect(extraRepo.save).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ concept: 'Honorarios', amount: 2800 }),
        expect.objectContaining({ concept: 'Maniobra nueva', amount: 500 }),
      ]),
    );
    expect(lineRepo.update).toHaveBeenCalledWith(
      { id: 'line-1' },
      expect.objectContaining({
        real_unit_cost_usd: expect.any(Number),
        real_unit_cost_mxn: expect.any(Number),
      }),
    );
  });

  it('limpia el costo real si no hay T.C. ni gastos', async () => {
    const previous = {
      ...po,
      customs_exchange_rate: 16.9593,
      landed_cost_lines: [{ concept: 'Flete', amount: 100, currency: 'MXN', sort_order: 0 }],
      line_items: [...po.line_items],
    };
    poRepo.findOne
      .mockResolvedValueOnce(previous)
      .mockResolvedValueOnce({
        ...po,
        customs_exchange_rate: null,
        landed_cost_lines: [],
        line_items: [...po.line_items],
      });

    await service.updateRealCost(
      'po-1',
      { customs_date: null, customs_exchange_rate: null, extra_costs: [] },
      't1',
      'user-1',
    );

    expect(extraRepo.save).not.toHaveBeenCalled();
    expect(lineRepo.update).toHaveBeenCalledWith(
      { id: 'line-1' },
      { real_unit_cost_usd: null, real_unit_cost_mxn: null },
    );
  });

  it('rechaza orden cancelada', async () => {
    poRepo.findOne.mockResolvedValue({ ...po, general_status: 'Cancelada' });
    await expect(
      service.updateRealCost('po-1', { extra_costs: [] }, 't1', 'user-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza OC inexistente', async () => {
    poRepo.findOne.mockResolvedValue(null);
    await expect(
      service.updateRealCost('missing', { extra_costs: [] }, 't1', 'user-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
