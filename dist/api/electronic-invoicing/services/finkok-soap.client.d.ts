import { FinkokEnvironment } from '../../../entities/electronic-invoicing/finkok-provider-configuration.entity';
export interface FinkokCredentials {
    username: string;
    password: string;
    environment: FinkokEnvironment;
}
export interface FinkokStampResult {
    success: boolean;
    xml?: string;
    uuid?: string;
    fecha?: string;
    codEstatus?: string;
    satSeal?: string;
    noCertificadoSat?: string;
    incidencias?: FinkokIncidencia[];
    rawResponse?: string;
}
export interface FinkokIncidencia {
    idIncidencia?: string;
    codigoError?: string;
    mensajeIncidencia?: string;
    extraInfo?: string;
    fechaRegistro?: string;
}
export interface FinkokCancelUuidInput {
    uuid: string;
    motivo: string;
    folioSustitucion?: string;
}
export interface FinkokCancelFolioResult {
    uuid: string;
    estatusUuid?: string;
    estatusCancelacion?: string;
}
export interface FinkokCancelResult {
    success: boolean;
    folios: FinkokCancelFolioResult[];
    acuse?: string;
    fecha?: string;
    rfcEmisor?: string;
    codEstatus?: string;
    rawResponse?: string;
}
export interface SatCfdiConsultaResult {
    success: boolean;
    source: 'sat' | 'finkok';
    codigoEstatus?: string;
    esCancelable?: string;
    estado?: string;
    estatusCancelacion?: string;
    validacionEfos?: string;
    error?: string;
    rawResponse?: string;
}
export declare class FinkokSoapClient {
    private readonly logger;
    private escapeXml;
    private registrationCredentialAttempts;
    private isAuthenticationFailedMessage;
    private extractXmlPayload;
    private normalizeStampXml;
    private extractTag;
    private extractSatBlock;
    private postSoap;
    signStamp(credentials: FinkokCredentials, xmlContent: string): Promise<FinkokStampResult>;
    private parseIncidencias;
    signCancel(credentials: FinkokCredentials, taxpayerId: string, certificateSerial: string | null | undefined, uuids: FinkokCancelUuidInput[], storePending?: boolean): Promise<FinkokCancelResult>;
    getSatStatusFinkok(credentials: FinkokCredentials, rfcEmisor: string, rfcReceptor: string, total: string, uuid: string): Promise<SatCfdiConsultaResult>;
    consultSatCfdi(rfcEmisor: string, rfcReceptor: string, total: string, uuid: string): Promise<SatCfdiConsultaResult>;
    private parseResellerUsers;
    registrationGet(credentials: FinkokCredentials, taxpayerId: string): Promise<{
        found: boolean;
        message?: string;
        users: Array<{
            status?: string;
            counter?: number;
            taxpayer_id?: string;
            credit?: number;
        }>;
        rawResponse?: string;
    }>;
    registrationAdd(credentials: FinkokCredentials, input: {
        taxpayerId: string;
        cerBase64: string;
        keyBase64: string;
        passphrase: string;
        typeUser?: string;
    }): Promise<{
        success: boolean;
        message?: string;
        rawResponse?: string;
    }>;
}
