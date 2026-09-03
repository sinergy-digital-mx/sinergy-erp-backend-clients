import { TenantContextService } from '../rbac/services/tenant-context.service';
import { DivinoReservationFormatService } from './divino-reservation-format.service';
import { CreateDivinoReservationFormatDto } from './dto/create-divino-reservation-format.dto';
import { UpdateDivinoReservationFormatDto } from './dto/update-divino-reservation-format.dto';
import { QueryDivinoReservationFormatDto } from './dto/query-divino-reservation-format.dto';
import { SendDivinoReservationFormatDto } from './dto/send-divino-reservation-format.dto';
export declare class DivinoReservationFormatController {
    private readonly service;
    private readonly tenantContext;
    constructor(service: DivinoReservationFormatService, tenantContext: TenantContextService);
    create(dto: CreateDivinoReservationFormatDto): Promise<import("../../entities/divino-reservation-formats/divino-reservation-format.entity").DivinoReservationFormat>;
    findAll(query: QueryDivinoReservationFormatDto): Promise<import("./divino-reservation-format.service").PaginatedDivinoReservationFormatDto>;
    findOne(id: string): Promise<import("../../entities/divino-reservation-formats/divino-reservation-format.entity").DivinoReservationFormat>;
    generatePdf(id: string, res: any): Promise<void>;
    send(id: string, dto: SendDivinoReservationFormatDto): Promise<import("../../entities/divino-reservation-formats/divino-reservation-format.entity").DivinoReservationFormat>;
    update(id: string, dto: UpdateDivinoReservationFormatDto): Promise<import("../../entities/divino-reservation-formats/divino-reservation-format.entity").DivinoReservationFormat>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
    private getTenantId;
}
