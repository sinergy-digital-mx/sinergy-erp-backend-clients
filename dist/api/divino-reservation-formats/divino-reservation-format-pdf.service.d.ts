import { S3Service } from '../../common/services/s3.service';
import { DivinoReservationFormat } from '../../entities/divino-reservation-formats/divino-reservation-format.entity';
export declare class DivinoReservationFormatPdfService {
    private readonly s3Service;
    private fonts;
    constructor(s3Service: S3Service);
    generate(format: DivinoReservationFormat): Promise<Buffer>;
    private buildHeader;
    private buildTitle;
    private buildIntro;
    private buildPropertySection;
    private buildPaymentPlan;
    private buildLegalText;
    private buildBuyerSection;
    private buildLeadSource;
    private buildSignatures;
    private buildFooter;
    private fieldCell;
    private signatureLine;
    private inlineValue;
    private cardLayout;
    private paymentDayText;
    private money;
    private num;
    private date;
    private getLogoImage;
}
