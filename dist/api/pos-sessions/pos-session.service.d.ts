import { Repository } from 'typeorm';
import { PosSession } from '../../entities/pos/pos-session.entity';
import { OpenPosSessionDto } from './dto/open-pos-session.dto';
import { ClosePosSessionDto } from './dto/close-pos-session.dto';
import { QueryPosSessionDto } from './dto/query-pos-session.dto';
export declare class PosSessionService {
    private readonly posSessionRepository;
    constructor(posSessionRepository: Repository<PosSession>);
    private toNumeric;
    openSession(dto: OpenPosSessionDto, userId: string, tenantId: string): Promise<PosSession>;
    closeSession(sessionId: string, dto: ClosePosSessionDto, userId: string, tenantId: string): Promise<PosSession>;
    findAll(query: QueryPosSessionDto, tenantId: string): Promise<{
        data: PosSession[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string, tenantId: string): Promise<PosSession>;
    getCurrentOpenSession(posConfigurationId: string, tenantId: string): Promise<PosSession | null>;
    updateSessionSales(sessionId: string, saleAmount: number, tenantId: string): Promise<void>;
}
