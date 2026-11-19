import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { QuotationExpirationService } from './quotation-expiration.service';

describe('QuotationExpirationService', () => {
  it('cancela cotizaciones Creada que ya cumplieron los días de la razón social', async () => {
    const dataSource = { query: jest.fn().mockResolvedValue({ affectedRows: 4 }) };
    const module = await Test.createTestingModule({
      providers: [
        QuotationExpirationService,
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    const service = module.get(QuotationExpirationService);
    await expect(service.cancelExpiredQuotations()).resolves.toBe(4);
    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining("q.general_status = 'Creada'"),
    );
    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('quotation_expiration_days'),
    );
  });
});
