import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PosSession, PosSessionStatus } from '../../entities/pos/pos-session.entity';
import { OpenPosSessionDto } from './dto/open-pos-session.dto';
import { ClosePosSessionDto } from './dto/close-pos-session.dto';
import { QueryPosSessionDto } from './dto/query-pos-session.dto';

@Injectable()
export class PosSessionService {
  constructor(
    @InjectRepository(PosSession)
    private readonly posSessionRepository: Repository<PosSession>,
  ) {}

  private toNumeric(value: unknown): number {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
  }

  async openSession(
    dto: OpenPosSessionDto,
    userId: string,
    tenantId: string,
  ): Promise<PosSession> {
    // Check if there's already an open session for this POS configuration
    const existingOpenSession = await this.posSessionRepository.findOne({
      where: {
        pos_configuration_id: dto.pos_configuration_id,
        tenant_id: tenantId,
        status: PosSessionStatus.OPEN,
      },
    });

    if (existingOpenSession) {
      throw new ConflictException(
        `Ya existe una sesión abierta para esta configuración de POS. Cierre primero la sesión ${existingOpenSession.session_number}.`,
      );
    }

    // Get the next session number for this POS configuration
    const lastSession = await this.posSessionRepository.findOne({
      where: {
        pos_configuration_id: dto.pos_configuration_id,
        tenant_id: tenantId,
      },
      order: { session_number: 'DESC' },
    });

    const sessionNumber = lastSession ? lastSession.session_number + 1 : 1;

    // Create new session
    const session = this.posSessionRepository.create({
      tenant_id: tenantId,
      pos_configuration_id: dto.pos_configuration_id,
      user_id: userId,
      session_number: sessionNumber,
      opening_cash: dto.opening_cash,
      status: PosSessionStatus.OPEN,
      notes: dto.notes,
      opened_at: new Date(),
    });

    return await this.posSessionRepository.save(session);
  }

  async closeSession(
    sessionId: string,
    dto: ClosePosSessionDto,
    userId: string,
    tenantId: string,
  ): Promise<PosSession> {
    const session = await this.posSessionRepository.findOne({
      where: { id: sessionId, tenant_id: tenantId },
    });

    if (!session) {
      throw new NotFoundException('Sesión no encontrada');
    }

    if (session.status !== PosSessionStatus.OPEN) {
      throw new BadRequestException('Solo se pueden cerrar sesiones abiertas');
    }

    // Calculate expected cash and difference
    const openingCash = this.toNumeric(session.opening_cash);
    const totalSales = this.toNumeric(session.total_sales);
    const closingCash = this.toNumeric(dto.closing_cash);
    const expectedCash = Number((openingCash + totalSales).toFixed(2));
    const cashDifference = Number((closingCash - expectedCash).toFixed(2));

    // Update session
    session.status = PosSessionStatus.CLOSED;
    session.closed_at = new Date();
    session.closing_cash = closingCash;
    session.expected_cash = expectedCash;
    session.cash_difference = cashDifference;
    session.closed_by = userId;
    
    if (dto.notes) {
      session.notes = session.notes 
        ? `${session.notes}\n[Closing] ${dto.notes}` 
        : dto.notes;
    }

    return await this.posSessionRepository.save(session);
  }

  async findAll(
    query: QueryPosSessionDto,
    tenantId: string,
  ): Promise<{ data: PosSession[]; total: number; page: number; limit: number; totalPages: number }> {
    const {
      page = 1,
      limit = 10,
      sucursal,
      pos_configuration_id,
      user_id,
      status,
      from_date,
      to_date,
    } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.posSessionRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.posConfiguration', 'posConfig')
      .leftJoinAndSelect('posConfig.branch', 'branch')
      .leftJoinAndSelect('session.user', 'user')
      .leftJoinAndSelect('session.closedByUser', 'closedBy')
      .where('session.tenant_id = :tenantId', { tenantId });

    if (sucursal) {
      queryBuilder.andWhere('posConfig.sucursal = :sucursal', { sucursal });
    }

    if (pos_configuration_id) {
      queryBuilder.andWhere('session.pos_configuration_id = :pos_configuration_id', {
        pos_configuration_id,
      });
    }

    if (user_id) {
      queryBuilder.andWhere('session.user_id = :user_id', { user_id });
    }

    if (status) {
      queryBuilder.andWhere('session.status = :status', { status });
    }

    if (from_date) {
      queryBuilder.andWhere('session.opened_at >= :from_date', { from_date });
    }

    if (to_date) {
      queryBuilder.andWhere('session.opened_at <= :to_date', { to_date });
    }

    const [data, total] = await queryBuilder
      .orderBy('session.opened_at', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, tenantId: string): Promise<PosSession> {
    const session = await this.posSessionRepository.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['posConfiguration', 'user', 'closedByUser'],
    });

    if (!session) {
      throw new NotFoundException('Sesión no encontrada');
    }

    return session;
  }

  async getCurrentOpenSession(
    posConfigurationId: string,
    tenantId: string,
  ): Promise<PosSession | null> {
    return await this.posSessionRepository.findOne({
      where: {
        pos_configuration_id: posConfigurationId,
        tenant_id: tenantId,
        status: PosSessionStatus.OPEN,
      },
      relations: ['posConfiguration', 'user'],
    });
  }

  async updateSessionSales(
    sessionId: string,
    saleAmount: number,
    tenantId: string,
  ): Promise<void> {
    const session = await this.posSessionRepository.findOne({
      where: { id: sessionId, tenant_id: tenantId },
    });

    if (!session) {
      throw new NotFoundException('Sesión no encontrada');
    }

    session.total_sales = Number(
      (this.toNumeric(session.total_sales) + this.toNumeric(saleAmount)).toFixed(2),
    );
    session.total_transactions += 1;

    await this.posSessionRepository.save(session);
  }
}
