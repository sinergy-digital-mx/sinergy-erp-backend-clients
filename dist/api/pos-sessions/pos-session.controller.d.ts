import { PosSessionService } from './pos-session.service';
import { OpenPosSessionDto } from './dto/open-pos-session.dto';
import { ClosePosSessionDto } from './dto/close-pos-session.dto';
import { QueryPosSessionDto } from './dto/query-pos-session.dto';
export declare class PosSessionController {
    private readonly posSessionService;
    constructor(posSessionService: PosSessionService);
    openSession(dto: OpenPosSessionDto, req: any): Promise<import("../../entities/pos/pos-session.entity").PosSession>;
    closeSession(id: string, dto: ClosePosSessionDto, req: any): Promise<import("../../entities/pos/pos-session.entity").PosSession>;
    findAll(query: QueryPosSessionDto, req: any): Promise<{
        data: import("../../entities/pos/pos-session.entity").PosSession[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getCurrentSession(posConfigId: string, req: any): Promise<import("../../entities/pos/pos-session.entity").PosSession | null>;
    findOne(id: string, req: any): Promise<import("../../entities/pos/pos-session.entity").PosSession>;
}
