import { PosSession } from '../../../entities/pos/pos-session.entity';
export declare class PaginatedPosSessionDto {
    data: PosSession[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
