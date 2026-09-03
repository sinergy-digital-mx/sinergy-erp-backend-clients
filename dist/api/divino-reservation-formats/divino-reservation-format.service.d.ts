import { Repository } from 'typeorm';
import { DivinoReservationFormat } from '../../entities/divino-reservation-formats/divino-reservation-format.entity';
import { Property } from '../../entities/properties/property.entity';
import { User } from '../../entities/users/user.entity';
import { CreateDivinoReservationFormatDto } from './dto/create-divino-reservation-format.dto';
import { UpdateDivinoReservationFormatDto } from './dto/update-divino-reservation-format.dto';
import { QueryDivinoReservationFormatDto } from './dto/query-divino-reservation-format.dto';
import { SendDivinoReservationFormatDto } from './dto/send-divino-reservation-format.dto';
import { DivinoReservationFormatPdfService } from './divino-reservation-format-pdf.service';
import { MailerConfigurationService } from '../mailer-configuration/services/mailer-configuration.service';
export interface PaginatedDivinoReservationFormatDto {
    data: DivinoReservationFormat[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}
export declare class DivinoReservationFormatService {
    private repo;
    private propertyRepo;
    private userRepo;
    private pdfService;
    private mailerConfigurationService;
    constructor(repo: Repository<DivinoReservationFormat>, propertyRepo: Repository<Property>, userRepo: Repository<User>, pdfService: DivinoReservationFormatPdfService, mailerConfigurationService: MailerConfigurationService);
    create(tenantId: string, dto: CreateDivinoReservationFormatDto, userId: string | null): Promise<DivinoReservationFormat>;
    findAll(tenantId: string, query?: QueryDivinoReservationFormatDto): Promise<PaginatedDivinoReservationFormatDto>;
    findOne(tenantId: string, id: string): Promise<DivinoReservationFormat>;
    update(tenantId: string, id: string, dto: UpdateDivinoReservationFormatDto): Promise<DivinoReservationFormat>;
    remove(tenantId: string, id: string): Promise<void>;
    generatePdf(tenantId: string, id: string): Promise<Buffer>;
    send(tenantId: string, id: string, dto: SendDivinoReservationFormatDto, userId: string | null): Promise<DivinoReservationFormat>;
    private buildEmailHtml;
    private getPropertyOrFail;
    private resolveUserName;
    private generateFolio;
}
