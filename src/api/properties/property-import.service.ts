import {
  BadRequestException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { QueryFailedError, Repository } from 'typeorm';
import { Property } from '../../entities/properties/property.entity';
import { MeasurementUnit } from '../../entities/properties/measurement-unit.entity';
import { CustomerGroupsService } from '../customers/customer-groups.service';
import {
  DEFAULT_CONTRACT_CURRENCY,
  normalizeContractCurrency,
} from '../contracts/contract-currency.util';
import { resolvePropertyPricing } from './utils/property-pricing.util';
import {
  buildPropertyImportTemplate,
  foldText,
  parsePropertyImportWorkbook,
  PropertyImportReadyRow,
  PropertyImportRowError,
  resolvePropertyImportRows,
} from './utils/property-import.util';
import {
  createPropertyImportJob,
  getPropertyImportJob,
  PropertyImportJob,
  updatePropertyImportJob,
} from './property-import-job.store';

@Injectable()
export class PropertyImportService {
  private readonly logger = new Logger(PropertyImportService.name);

  constructor(
    @InjectRepository(Property)
    private readonly propertyRepo: Repository<Property>,
    @InjectRepository(MeasurementUnit)
    private readonly measurementUnitRepo: Repository<MeasurementUnit>,
    private readonly customerGroupsService: CustomerGroupsService,
  ) {}

  async exportTemplate(
    organizationId: string,
  ): Promise<{ buffer: Buffer; filename: string }> {
    const [units, groups] = await Promise.all([
      this.measurementUnitRepo.find({ order: { system: 'ASC', name: 'ASC' } }),
      this.customerGroupsService.findOptions(organizationId),
    ]);
    const buffer = await buildPropertyImportTemplate({
      units: units.map((unit) => ({
        code: unit.code,
        name: unit.name,
        symbol: unit.symbol,
      })),
      groups: groups.map((group) => ({ name: group.name })),
    });
    return { buffer, filename: 'plantilla-lotes.xlsx' };
  }

  async startImportJob(
    organizationId: string,
    file?: Express.Multer.File,
  ): Promise<PropertyImportJob> {
    const { ready, skipped } = await this.resolveReadyRows(organizationId, file);
    const job = createPropertyImportJob({
      id: randomUUID(),
      organizationId,
      total: ready.length,
    });

    if (!ready.length) {
      this.completeJob(job.id, 0, skipped);
      return getPropertyImportJob(job.id, organizationId) ?? job;
    }

    setImmediate(() => {
      this.runImportJob(job.id, organizationId, ready, skipped).catch((error) => {
        this.logger.error(`Import job ${job.id} failed`, error);
        updatePropertyImportJob(job.id, {
          status: 'failed',
          message: 'Error al importar',
          error: this.toErrorMessage(error),
        });
      });
    });

    return job;
  }

  getJobStatus(jobId: string, organizationId: string): PropertyImportJob {
    const job = getPropertyImportJob(jobId, organizationId);
    if (!job) {
      throw new NotFoundException('No encontramos este trabajo de importación.');
    }
    return job;
  }

  async importWorkbook(
    organizationId: string,
    file?: Express.Multer.File,
  ): Promise<{ created: number; skipped: PropertyImportRowError[] }> {
    const { ready, skipped } = await this.resolveReadyRows(organizationId, file);
    const persistSkipped = await this.persistRows(organizationId, ready);
    const allSkipped = [...skipped, ...persistSkipped];
    return { created: ready.length - persistSkipped.length, skipped: allSkipped };
  }

  private async resolveReadyRows(
    organizationId: string,
    file?: Express.Multer.File,
  ): Promise<{ ready: PropertyImportReadyRow[]; skipped: PropertyImportRowError[] }> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Adjunta la plantilla de lotes en Excel.');
    }
    const name = (file.originalname || '').toLowerCase();
    if (!name.endsWith('.xlsx') && !name.endsWith('.xls')) {
      throw new BadRequestException('El archivo debe ser Excel (.xlsx).');
    }

    const parsed = parsePropertyImportWorkbook(file.buffer);
    if (!parsed.rows.length) {
      throw new BadRequestException(
        parsed.errors[0]?.message || 'El archivo no tiene lotes para importar.',
      );
    }

    const [units, groups, existing] = await Promise.all([
      this.measurementUnitRepo.find(),
      this.customerGroupsService.findOptions(organizationId),
      this.findExistingCodes(organizationId),
    ]);

    const resolved = resolvePropertyImportRows(
      parsed.rows,
      {
        groups: groups.map((group) => ({ id: group.id, name: group.name })),
        units: units.map((unit) => ({
          id: unit.id,
          code: unit.code,
          name: unit.name,
          symbol: unit.symbol,
        })),
        existingCodes: existing,
      },
      parsed.errors,
    );

    if (!resolved.ready.length && !resolved.errors.length) {
      throw new BadRequestException('El archivo no tiene lotes para importar.');
    }

    return { ready: resolved.ready, skipped: resolved.errors };
  }

  private async runImportJob(
    jobId: string,
    organizationId: string,
    ready: PropertyImportReadyRow[],
    skipped: PropertyImportRowError[],
  ): Promise<void> {
    updatePropertyImportJob(jobId, {
      status: 'processing',
      processed: 0,
      message: `Importando 0 de ${ready.length}`,
    });

    try {
      const persistSkipped = await this.persistRows(
        organizationId,
        ready,
        (processed, total, code) => {
          updatePropertyImportJob(jobId, {
            status: 'processing',
            processed,
            total,
            current_code: code,
            message: `Importando ${processed} de ${total}`,
          });
        },
      );
      this.completeJob(jobId, ready.length - persistSkipped.length, [...skipped, ...persistSkipped]);
    } catch (error) {
      updatePropertyImportJob(jobId, {
        status: 'failed',
        message: 'Error al importar',
        error: this.toErrorMessage(error),
      });
    }
  }

  private completeJob(
    jobId: string,
    created: number,
    skipped: PropertyImportRowError[],
  ): void {
    const ordered = [...skipped].sort(
      (left, right) => left.row - right.row || left.message.localeCompare(right.message),
    );
    updatePropertyImportJob(jobId, {
      status: 'completed',
      current_code: null,
      message: this.summaryMessage(created, ordered.length),
      result: { created, skipped: ordered },
      error: null,
    });
  }

  private async persistRows(
    organizationId: string,
    ready: PropertyImportReadyRow[],
    onProgress?: (processed: number, total: number, code: string) => void,
  ): Promise<PropertyImportRowError[]> {
    const skipped: PropertyImportRowError[] = [];
    let processed = 0;

    for (const item of ready) {
      const dto = item.dto;
      const pricing = resolvePropertyPricing({
        totalArea: dto.total_area,
        totalPrice: dto.total_price,
        pricePerM2: dto.price_per_m2,
        isCreate: true,
      });

      try {
        const entity = this.propertyRepo.create({
          ...dto,
          tenant_id: organizationId,
          currency: normalizeContractCurrency(dto.currency, DEFAULT_CONTRACT_CURRENCY),
          cadastral_key: dto.cadastral_key?.trim() || null,
          total_price: pricing.total_price,
          price_per_m2: pricing.price_per_m2,
          status: dto.status || 'disponible',
        });
        await this.propertyRepo.save(entity);
      } catch (error) {
        if (this.isDuplicateCodeError(error)) {
          skipped.push({
            row: item.row,
            code: dto.code,
            message: `Ya existe un lote con el código "${dto.code}".`,
          });
        } else {
          throw error;
        }
      }

      processed += 1;
      onProgress?.(processed, ready.length, dto.code);
    }

    return skipped;
  }

  private isDuplicateCodeError(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }
    const driverErr = error.driverError as { code?: string; errno?: number } | undefined;
    return (
      driverErr?.code === 'ER_DUP_ENTRY' ||
      driverErr?.errno === 1062 ||
      /Duplicate entry/i.test(error.message)
    );
  }

  private summaryMessage(created: number, skipped: number): string {
    const createdText = created === 1 ? 'Se creó 1 lote.' : `Se crearon ${created} lotes.`;
    if (!skipped) {
      return created === 0 ? 'No se importó ningún lote.' : createdText;
    }
    const skippedText = skipped === 1 ? '1 no se importó.' : `${skipped} no se importaron.`;
    if (!created) {
      return `No se importó ningún lote. ${skippedText}`;
    }
    return `${createdText} ${skippedText}`;
  }

  private toErrorMessage(error: unknown): string {
    if (error instanceof HttpException) {
      const response = error.getResponse();
      if (typeof response === 'string') {
        return response;
      }
      if (response && typeof response === 'object' && 'message' in response) {
        const message = (response as { message: unknown }).message;
        return Array.isArray(message) ? message.join(', ') : String(message);
      }
    }
    return error instanceof Error ? error.message : 'No se pudieron importar los lotes.';
  }

  private async findExistingCodes(organizationId: string): Promise<Set<string>> {
    const rows = await this.propertyRepo
      .createQueryBuilder('p')
      .select('p.code', 'code')
      .where('p.tenant_id = :organizationId', { organizationId })
      .getRawMany<{ code: string }>();
    return new Set(rows.map((row) => foldText(row.code)));
  }
}
