import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FiscalConfiguration } from '../../entities/billing/fiscal-configuration.entity';
import { CreateFiscalConfigurationDto } from './dto/create-fiscal-configuration.dto';
import { UpdateFiscalConfigurationDto } from './dto/update-fiscal-configuration.dto';
import { QueryFiscalConfigurationDto } from './dto/query-fiscal-configuration.dto';
import { PaginatedFiscalConfigurationDto } from './dto/paginated-fiscal-configuration.dto';
import { S3Service } from '../../common/services/s3.service';
import { normalizeDocumentPrefix } from '../../common/utils/document-prefix.util';

@Injectable()
export class FiscalConfigurationService {
  constructor(
    @InjectRepository(FiscalConfiguration)
    private repo: Repository<FiscalConfiguration>,
    private readonly s3Service: S3Service,
  ) {}

  async create(
    dto: CreateFiscalConfigurationDto,
    tenantId: string,
    userId?: string,
  ): Promise<FiscalConfiguration> {
    const config = this.repo.create({
      ...dto,
      prefix: normalizeDocumentPrefix(dto.prefix),
      tenant_id: tenantId,
      status: dto.status || 'active',
      created_by: userId ?? null,
    });
    const saved = await this.repo.save(config);
    const created = Array.isArray(saved) ? saved[0] : saved;
    await this.persistPrefix(created.id, tenantId, normalizeDocumentPrefix(dto.prefix));
    return this.findOne(created.id, tenantId);
  }

  async findAll(
    tenantId: string,
    query?: QueryFiscalConfigurationDto,
  ): Promise<PaginatedFiscalConfigurationDto> {
    let page = Number(query?.page) || 1;
    let limit = Number(query?.limit) || 20;

    if (page < 1) page = 1;
    if (limit < 1) limit = 1;
    if (limit > 100) limit = 100;

    const skip = (page - 1) * limit;

    const queryBuilder = this.repo
      .createQueryBuilder('config')
      .where('config.tenant_id = :tenantId', { tenantId });

    if (query?.search) {
      queryBuilder.andWhere(
        '(LOWER(config.razon_social) LIKE LOWER(:search) OR LOWER(config.rfc) LIKE LOWER(:search) OR LOWER(`config`.`prefix`) LIKE LOWER(:search))',
        { search: `%${query.search}%` }
      );
    }

    if (query?.status) {
      queryBuilder.andWhere('config.status = :status', { status: query.status });
    }

    queryBuilder.orderBy('config.created_at', 'ASC');

    const total = await queryBuilder.getCount();
    const data = await queryBuilder.skip(skip).take(limit).getMany();
    const withPrefix = await this.attachPrefixes(data);
    const dataWithLogoUrls = await Promise.all(
      withPrefix.map((config) => this.toResponseWithLogoUrl(config)),
    );

    const totalPages = Math.ceil(total / limit);

    return {
      data: dataWithLogoUrls,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  async findOne(id: string, tenantId: string): Promise<FiscalConfiguration> {
    const config = await this.getByIdOrFail(id, tenantId);
    return this.toResponseWithLogoUrl(config);
  }



  async update(
    id: string,
    dto: UpdateFiscalConfigurationDto,
    tenantId: string,
  ): Promise<FiscalConfiguration> {
    await this.getByIdOrFail(id, tenantId);

    const patch: Partial<FiscalConfiguration> = {};
    if (dto.razon_social !== undefined) patch.razon_social = dto.razon_social;
    if (dto.rfc !== undefined) patch.rfc = dto.rfc;
    if (dto.persona_type !== undefined) patch.persona_type = dto.persona_type;
    if (dto.fiscal_regime !== undefined) patch.fiscal_regime = dto.fiscal_regime;
    if (dto.digital_seal !== undefined) patch.digital_seal = dto.digital_seal;
    if (dto.digital_seal_password !== undefined) patch.digital_seal_password = dto.digital_seal_password;
    if (dto.private_key !== undefined) patch.private_key = dto.private_key;
    if (dto.logo !== undefined) patch.logo = dto.logo;
    if (dto.status !== undefined) patch.status = dto.status;

    if (Object.keys(patch).length) {
      await this.repo.update({ id, tenant_id: tenantId }, patch);
    }

    if (dto.prefix !== undefined) {
      await this.persistPrefix(id, tenantId, normalizeDocumentPrefix(dto.prefix));
    }

    return this.findOne(id, tenantId);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const config = await this.getByIdOrFail(id, tenantId);
    await this.repo.remove(config);
  }

  async uploadLogo(
    id: string,
    tenantId: string,
    file: Express.Multer.File,
  ): Promise<FiscalConfiguration> {
    const config = await this.getByIdOrFail(id, tenantId);

    if (config.logo) {
      await this.s3Service.deleteFile(config.logo).catch(() => undefined);
    }

    const s3Key = await this.s3Service.uploadEntityFile(
      tenantId,
      'fiscal_configurations',
      id,
      'logo',
      file.buffer,
      file.originalname,
      file.mimetype,
    );

    config.logo = s3Key;
    const saved = await this.repo.save(config);
    return this.toResponseWithLogoUrl(saved);
  }

  private async getByIdOrFail(id: string, tenantId: string): Promise<FiscalConfiguration> {
    if (!id || id === 'undefined' || id === 'null') {
      throw new BadRequestException(
        'Falta el identificador de la razón social. Guárdela antes de continuar.',
      );
    }

    const config = await this.repo.findOne({
      where: { id, tenant_id: tenantId },
    });

    if (!config) {
      throw new NotFoundException('Razón social no encontrada');
    }

    const [withPrefix] = await this.attachPrefixes([config]);
    return withPrefix;
  }

  private async persistPrefix(
    id: string,
    tenantId: string,
    prefix: string | null,
  ): Promise<void> {
    await this.repo.query(
      'UPDATE fiscal_configurations SET prefix = ? WHERE id = ? AND tenant_id = ?',
      [prefix, id, tenantId],
    );
  }

  private async attachPrefixes(
    configs: FiscalConfiguration[],
  ): Promise<FiscalConfiguration[]> {
    if (!configs.length) {
      return configs;
    }

    const ids = configs.map((config) => config.id);
    const placeholders = ids.map(() => '?').join(',');
    const rows: { id: string; prefix: string | null }[] = await this.repo.query(
      `SELECT id, prefix FROM fiscal_configurations WHERE id IN (${placeholders})`,
      ids,
    );
    const prefixById = new Map(rows.map((row) => [row.id, row.prefix ?? null]));

    return configs.map((config) => {
      config.prefix = prefixById.get(config.id) ?? null;
      return config;
    });
  }

  private async toResponseWithLogoUrl(config: FiscalConfiguration): Promise<FiscalConfiguration> {
    const prefix = config.prefix ?? null;
    if (!config.logo) {
      return { ...config, prefix };
    }

    const logoUrl = await this.s3Service
      .getSignedUrl(config.logo, 900)
      .catch(() => config.logo);

    return {
      ...config,
      prefix,
      logo: logoUrl,
    };
  }
}
