declare class SendWhatsappBaseDto {
    phone: string;
    reference_type?: string;
    reference_id?: string;
}
export declare class SendWhatsappTextDto extends SendWhatsappBaseDto {
    text: string;
}
export declare class SendWhatsappFileDto extends SendWhatsappBaseDto {
    file_url: string;
    file_name?: string;
    mimetype?: string;
    caption?: string;
}
export declare class WhatsappPairingCodeDto {
    phone: string;
}
export declare class QueryWhatsappMessagesDto {
    page?: number;
    limit?: number;
    status?: string;
    phone?: string;
    reference_type?: string;
    reference_id?: string;
}
export {};
