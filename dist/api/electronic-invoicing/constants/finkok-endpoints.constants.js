"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SAT_CONSULTA_NAMESPACE = exports.FINKOK_APPS_NAMESPACE = exports.FINKOK_REGISTRATION_NAMESPACE = exports.FINKOK_CANCEL_NAMESPACE = exports.FINKOK_STAMP_NAMESPACE = exports.SAT_SOAP_ACTIONS = exports.FINKOK_SOAP_ACTIONS = exports.SAT_CONSULTA_CFDI_ENDPOINT = exports.SAT_CONSULTA_CFDI_WSDL = exports.FINKOK_REGISTRATION_ENDPOINT = exports.FINKOK_REGISTRATION_WSDL = exports.FINKOK_CANCEL_ENDPOINT = exports.FINKOK_CANCEL_WSDL = exports.FINKOK_STAMP_ENDPOINT = exports.FINKOK_STAMP_WSDL = void 0;
exports.FINKOK_STAMP_WSDL = {
    production: 'https://facturacion.finkok.com/servicios/soap/stamp.wsdl',
    demo: 'https://demo-facturacion.finkok.com/servicios/soap/stamp.wsdl',
};
exports.FINKOK_STAMP_ENDPOINT = {
    production: 'https://facturacion.finkok.com/servicios/soap/stamp',
    demo: 'https://demo-facturacion.finkok.com/servicios/soap/stamp',
};
exports.FINKOK_CANCEL_WSDL = {
    production: 'https://facturacion.finkok.com/servicios/soap/cancel.wsdl',
    demo: 'https://demo-facturacion.finkok.com/servicios/soap/cancel.wsdl',
};
exports.FINKOK_CANCEL_ENDPOINT = {
    production: 'https://facturacion.finkok.com/servicios/soap/cancel',
    demo: 'https://demo-facturacion.finkok.com/servicios/soap/cancel',
};
exports.FINKOK_REGISTRATION_WSDL = {
    production: 'https://facturacion.finkok.com/servicios/soap/registration.wsdl',
    demo: 'https://demo-facturacion.finkok.com/servicios/soap/registration.wsdl',
};
exports.FINKOK_REGISTRATION_ENDPOINT = {
    production: 'https://facturacion.finkok.com/servicios/soap/registration',
    demo: 'https://demo-facturacion.finkok.com/servicios/soap/registration',
};
exports.SAT_CONSULTA_CFDI_WSDL = 'https://consultaqr.facturaelectronica.sat.gob.mx/ConsultaCFDIService.svc?WSDL';
exports.SAT_CONSULTA_CFDI_ENDPOINT = 'https://consultaqr.facturaelectronica.sat.gob.mx/ConsultaCFDIService.svc';
exports.FINKOK_SOAP_ACTIONS = {
    sign_stamp: 'sign_stamp',
    sign_cancel: 'sign_cancel',
    get_sat_status: 'get_sat_status',
    registration_get: 'get',
    registration_add: 'add',
    registration_edit: 'edit',
};
exports.SAT_SOAP_ACTIONS = {
    consulta: 'http://tempuri.org/IConsultaCFDIService/Consulta',
};
exports.FINKOK_STAMP_NAMESPACE = 'http://facturacion.finkok.com/stamp';
exports.FINKOK_CANCEL_NAMESPACE = 'http://facturacion.finkok.com/cancel';
exports.FINKOK_REGISTRATION_NAMESPACE = 'http://facturacion.finkok.com/registration';
exports.FINKOK_APPS_NAMESPACE = 'apps.services.soap.core.views';
exports.SAT_CONSULTA_NAMESPACE = 'http://tempuri.org/';
//# sourceMappingURL=finkok-endpoints.constants.js.map