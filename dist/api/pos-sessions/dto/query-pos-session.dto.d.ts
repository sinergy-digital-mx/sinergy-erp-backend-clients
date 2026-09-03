import { PosSessionStatus } from '../../../entities/pos/pos-session.entity';
export declare class QueryPosSessionDto {
    page?: number;
    limit?: number;
    sucursal?: string;
    pos_configuration_id?: string;
    user_id?: string;
    status?: PosSessionStatus;
    from_date?: string;
    to_date?: string;
}
