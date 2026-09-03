import { FinkokEnvironment } from '../../../entities/electronic-invoicing/finkok-provider-configuration.entity';
export declare const FINKOK_STAMP_WSDL: Record<FinkokEnvironment, string>;
export declare const FINKOK_STAMP_ENDPOINT: Record<FinkokEnvironment, string>;
export declare const FINKOK_CANCEL_WSDL: Record<FinkokEnvironment, string>;
export declare const FINKOK_CANCEL_ENDPOINT: Record<FinkokEnvironment, string>;
export declare const FINKOK_REGISTRATION_WSDL: Record<FinkokEnvironment, string>;
export declare const FINKOK_REGISTRATION_ENDPOINT: Record<FinkokEnvironment, string>;
export declare const SAT_CONSULTA_CFDI_WSDL = "https://consultaqr.facturaelectronica.sat.gob.mx/ConsultaCFDIService.svc?WSDL";
export declare const SAT_CONSULTA_CFDI_ENDPOINT = "https://consultaqr.facturaelectronica.sat.gob.mx/ConsultaCFDIService.svc";
export declare const FINKOK_SOAP_ACTIONS: {
    readonly sign_stamp: "sign_stamp";
    readonly sign_cancel: "sign_cancel";
    readonly get_sat_status: "get_sat_status";
    readonly registration_get: "get";
    readonly registration_add: "add";
    readonly registration_edit: "edit";
};
export declare const SAT_SOAP_ACTIONS: {
    readonly consulta: "http://tempuri.org/IConsultaCFDIService/Consulta";
};
export declare const FINKOK_STAMP_NAMESPACE = "http://facturacion.finkok.com/stamp";
export declare const FINKOK_CANCEL_NAMESPACE = "http://facturacion.finkok.com/cancel";
export declare const FINKOK_REGISTRATION_NAMESPACE = "http://facturacion.finkok.com/registration";
export declare const FINKOK_APPS_NAMESPACE = "apps.services.soap.core.views";
export declare const SAT_CONSULTA_NAMESPACE = "http://tempuri.org/";
