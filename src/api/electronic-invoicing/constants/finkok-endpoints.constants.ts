import { FinkokEnvironment } from '../../../entities/electronic-invoicing/finkok-provider-configuration.entity';

/**
 * Endpoints oficiales Finkok y SAT según WSDL publicados.
 * WSDL describe el contrato; el POST SOAP va al soap:address (sin .wsdl).
 */
export const FINKOK_STAMP_WSDL: Record<FinkokEnvironment, string> = {
  production: 'https://facturacion.finkok.com/servicios/soap/stamp.wsdl',
  demo: 'https://demo-facturacion.finkok.com/servicios/soap/stamp.wsdl',
};

export const FINKOK_STAMP_ENDPOINT: Record<FinkokEnvironment, string> = {
  production: 'https://facturacion.finkok.com/servicios/soap/stamp',
  demo: 'https://demo-facturacion.finkok.com/servicios/soap/stamp',
};

export const FINKOK_CANCEL_WSDL: Record<FinkokEnvironment, string> = {
  production: 'https://facturacion.finkok.com/servicios/soap/cancel.wsdl',
  demo: 'https://demo-facturacion.finkok.com/servicios/soap/cancel.wsdl',
};

export const FINKOK_CANCEL_ENDPOINT: Record<FinkokEnvironment, string> = {
  production: 'https://facturacion.finkok.com/servicios/soap/cancel',
  demo: 'https://demo-facturacion.finkok.com/servicios/soap/cancel',
};

export const FINKOK_REGISTRATION_WSDL: Record<FinkokEnvironment, string> = {
  production: 'https://facturacion.finkok.com/servicios/soap/registration.wsdl',
  demo: 'https://demo-facturacion.finkok.com/servicios/soap/registration.wsdl',
};

export const FINKOK_REGISTRATION_ENDPOINT: Record<FinkokEnvironment, string> = {
  production: 'https://facturacion.finkok.com/servicios/soap/registration',
  demo: 'https://demo-facturacion.finkok.com/servicios/soap/registration',
};

/** WebService directo del SAT (no es Finkok) */
export const SAT_CONSULTA_CFDI_WSDL =
  'https://consultaqr.facturaelectronica.sat.gob.mx/ConsultaCFDIService.svc?WSDL';

export const SAT_CONSULTA_CFDI_ENDPOINT =
  'https://consultaqr.facturaelectronica.sat.gob.mx/ConsultaCFDIService.svc';

/** SOAPAction según binding WSDL */
export const FINKOK_SOAP_ACTIONS = {
  sign_stamp: 'sign_stamp',
  sign_cancel: 'sign_cancel',
  get_sat_status: 'get_sat_status',
  registration_get: 'get',
  registration_add: 'add',
  registration_edit: 'edit',
} as const;

export const SAT_SOAP_ACTIONS = {
  consulta: 'http://tempuri.org/IConsultaCFDIService/Consulta',
} as const;

export const FINKOK_STAMP_NAMESPACE = 'http://facturacion.finkok.com/stamp';
export const FINKOK_CANCEL_NAMESPACE = 'http://facturacion.finkok.com/cancel';
export const FINKOK_REGISTRATION_NAMESPACE = 'http://facturacion.finkok.com/registration';
export const FINKOK_APPS_NAMESPACE = 'apps.services.soap.core.views';
export const SAT_CONSULTA_NAMESPACE = 'http://tempuri.org/';
