"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var FinkokSoapClient_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinkokSoapClient = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const finkok_endpoints_constants_1 = require("../constants/finkok-endpoints.constants");
const cfdi_xml_parser_1 = require("../utils/cfdi-xml.parser");
const STAMP_SUCCESS = 'Comprobante timbrado satisfactoriamente';
let FinkokSoapClient = FinkokSoapClient_1 = class FinkokSoapClient {
    logger = new common_1.Logger(FinkokSoapClient_1.name);
    escapeXml(value) {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }
    registrationCredentialAttempts(credentials) {
        const username = this.escapeXml(credentials.username);
        const password = this.escapeXml(credentials.password);
        return [
            `<reg:reseller_username>${username}</reg:reseller_username>
      <reg:reseller_password>${password}</reg:reseller_password>`,
            `<reg:username>${username}</reg:username>
      <reg:password>${password}</reg:password>`,
        ];
    }
    isAuthenticationFailedMessage(message) {
        return (message ?? '').toLowerCase().includes('authentication failed');
    }
    extractXmlPayload(body) {
        const cdataMatch = /<(?:\w+:)?xml(?:\s[^>]*)?><!\[CDATA\[([\s\S]*?)\]\]><\/(?:\w+:)?xml>/i.exec(body);
        if (cdataMatch) {
            return cdataMatch[1].trim();
        }
        const block = /<(?:\w+:)?xml(?:\s[^>]*)?>([\s\S]*?)<\/(?:\w+:)?xml>/i.exec(body);
        return block?.[1]?.trim();
    }
    normalizeStampXml(raw) {
        if (!raw) {
            return undefined;
        }
        return (0, cfdi_xml_parser_1.normalizeCfdiXml)(raw);
    }
    extractTag(xml, tag) {
        const cdataMatch = new RegExp(`<(?:\\w+:)?${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></(?:\\w+:)?${tag}>`, 'i').exec(xml);
        if (cdataMatch) {
            return cdataMatch[1].trim();
        }
        const simpleMatch = new RegExp(`<(?:\\w+:)?${tag}>([^<]*)</(?:\\w+:)?${tag}>`, 'i').exec(xml);
        return simpleMatch?.[1]?.trim();
    }
    extractSatBlock(body) {
        const satBlock = body.match(/<(?:\w+:)?sat>[\s\S]*?<\/(?:\w+:)?sat>/i)?.[0];
        return satBlock ?? body;
    }
    async postSoap(url, soapAction, envelope, timeoutMs) {
        const response = await axios_1.default.post(url, envelope, {
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                SOAPAction: soapAction,
            },
            timeout: timeoutMs,
        });
        return String(response.data);
    }
    async signStamp(credentials, xmlContent) {
        const xmlBase64 = Buffer.from(xmlContent, 'utf8').toString('base64');
        const envelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:stam="${finkok_endpoints_constants_1.FINKOK_STAMP_NAMESPACE}">
  <soapenv:Header/>
  <soapenv:Body>
    <stam:sign_stamp>
      <stam:xml>${this.escapeXml(xmlBase64)}</stam:xml>
      <stam:username>${this.escapeXml(credentials.username)}</stam:username>
      <stam:password>${this.escapeXml(credentials.password)}</stam:password>
    </stam:sign_stamp>
  </soapenv:Body>
</soapenv:Envelope>`;
        const url = finkok_endpoints_constants_1.FINKOK_STAMP_ENDPOINT[credentials.environment];
        this.logger.debug(`Sign_Stamp → ${url}`);
        const body = await this.postSoap(url, finkok_endpoints_constants_1.FINKOK_SOAP_ACTIONS.sign_stamp, envelope, 120_000);
        const codEstatus = this.extractTag(body, 'CodEstatus');
        const stampedXml = this.normalizeStampXml(this.extractXmlPayload(body));
        const uuid = this.extractTag(body, 'UUID');
        const fecha = this.extractTag(body, 'Fecha');
        const satSeal = this.extractTag(body, 'SatSeal');
        const noCertificadoSat = this.extractTag(body, 'NoCertificadoSAT');
        const incidencias = this.parseIncidencias(body);
        const success = codEstatus === STAMP_SUCCESS ||
            (codEstatus !== undefined && incidencias.some((i) => i.codigoError === '307'));
        return {
            success,
            xml: stampedXml,
            uuid,
            fecha,
            codEstatus,
            satSeal,
            noCertificadoSat,
            incidencias,
            rawResponse: body,
        };
    }
    parseIncidencias(body) {
        const blocks = body.match(/<(?:\w+:)?Incidencia>[\s\S]*?<\/(?:\w+:)?Incidencia>/gi) ?? [];
        return blocks.map((block) => ({
            idIncidencia: this.extractTag(block, 'IdIncidencia'),
            codigoError: this.extractTag(block, 'CodigoError'),
            mensajeIncidencia: this.extractTag(block, 'MensajeIncidencia'),
            extraInfo: this.extractTag(block, 'ExtraInfo'),
            fechaRegistro: this.extractTag(block, 'FechaRegistro'),
        }));
    }
    async signCancel(credentials, taxpayerId, certificateSerial, uuids, storePending = false) {
        const uuidNodes = uuids
            .map((item) => `<apps:UUID UUID="${this.escapeXml(item.uuid)}" FolioSustitucion="${this.escapeXml(item.folioSustitucion ?? '')}" Motivo="${this.escapeXml(item.motivo)}"/>`)
            .join('');
        const serial = certificateSerial?.trim();
        const serialNode = serial
            ? `\n      <can:serial>${this.escapeXml(serial)}</can:serial>`
            : '';
        const envelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:can="${finkok_endpoints_constants_1.FINKOK_CANCEL_NAMESPACE}" xmlns:apps="${finkok_endpoints_constants_1.FINKOK_APPS_NAMESPACE}">
  <soapenv:Header/>
  <soapenv:Body>
    <can:sign_cancel>
      <can:UUIDS>${uuidNodes}</can:UUIDS>
      <can:username>${this.escapeXml(credentials.username)}</can:username>
      <can:password>${this.escapeXml(credentials.password)}</can:password>
      <can:taxpayer_id>${this.escapeXml(taxpayerId)}</can:taxpayer_id>${serialNode}
      <can:store_pending>${storePending}</can:store_pending>
    </can:sign_cancel>
  </soapenv:Body>
</soapenv:Envelope>`;
        const url = finkok_endpoints_constants_1.FINKOK_CANCEL_ENDPOINT[credentials.environment];
        this.logger.debug(`Sign_Cancel → ${url}`);
        const body = await this.postSoap(url, finkok_endpoints_constants_1.FINKOK_SOAP_ACTIONS.sign_cancel, envelope, 120_000);
        const codEstatus = this.extractTag(body, 'CodEstatus');
        const folioBlocks = body.match(/<(?:\w+:)?Folio>[\s\S]*?<\/(?:\w+:)?Folio>/gi) ?? [];
        const folios = folioBlocks.map((block) => ({
            uuid: this.extractTag(block, 'UUID') ?? '',
            estatusUuid: this.extractTag(block, 'EstatusUUID'),
            estatusCancelacion: this.extractTag(block, 'EstatusCancelacion'),
        }));
        if (folios.length === 0 && codEstatus) {
            return {
                success: false,
                folios: [],
                codEstatus,
                rawResponse: body,
            };
        }
        return {
            success: folios.length > 0,
            folios,
            acuse: this.extractTag(body, 'Acuse'),
            fecha: this.extractTag(body, 'Fecha'),
            rfcEmisor: this.extractTag(body, 'RfcEmisor'),
            codEstatus,
            rawResponse: body,
        };
    }
    async getSatStatusFinkok(credentials, rfcEmisor, rfcReceptor, total, uuid) {
        const envelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:can="${finkok_endpoints_constants_1.FINKOK_CANCEL_NAMESPACE}">
  <soapenv:Header/>
  <soapenv:Body>
    <can:get_sat_status>
      <can:username>${this.escapeXml(credentials.username)}</can:username>
      <can:password>${this.escapeXml(credentials.password)}</can:password>
      <can:taxpayer_id>${this.escapeXml(rfcEmisor)}</can:taxpayer_id>
      <can:rtaxpayer_id>${this.escapeXml(rfcReceptor)}</can:rtaxpayer_id>
      <can:uuid>${this.escapeXml(uuid)}</can:uuid>
      <can:total>${this.escapeXml(total)}</can:total>
    </can:get_sat_status>
  </soapenv:Body>
</soapenv:Envelope>`;
        const url = finkok_endpoints_constants_1.FINKOK_CANCEL_ENDPOINT[credentials.environment];
        this.logger.debug(`Get_sat_status (Finkok) → ${url}`);
        const body = await this.postSoap(url, finkok_endpoints_constants_1.FINKOK_SOAP_ACTIONS.get_sat_status, envelope, 60_000);
        const satXml = this.extractSatBlock(body);
        const error = this.extractTag(body, 'error');
        const estado = this.extractTag(satXml, 'Estado');
        if (error) {
            return { success: false, source: 'finkok', error, rawResponse: body };
        }
        return {
            success: Boolean(estado),
            source: 'finkok',
            codigoEstatus: this.extractTag(satXml, 'CodigoEstatus'),
            esCancelable: this.extractTag(satXml, 'EsCancelable'),
            estado,
            estatusCancelacion: this.extractTag(satXml, 'EstatusCancelacion'),
            validacionEfos: this.extractTag(satXml, 'ValidacionEFOS'),
            rawResponse: body,
        };
    }
    async consultSatCfdi(rfcEmisor, rfcReceptor, total, uuid) {
        const expresionImpresa = `?re=${rfcEmisor}&rr=${rfcReceptor}&tt=${total}&id=${uuid}`;
        const envelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="${finkok_endpoints_constants_1.SAT_CONSULTA_NAMESPACE}">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:Consulta>
      <tem:expresionImpresa>${this.escapeXml(expresionImpresa)}</tem:expresionImpresa>
    </tem:Consulta>
  </soapenv:Body>
</soapenv:Envelope>`;
        this.logger.debug(`ConsultaCFDI (SAT) → ${finkok_endpoints_constants_1.SAT_CONSULTA_CFDI_ENDPOINT}`);
        const body = await this.postSoap(finkok_endpoints_constants_1.SAT_CONSULTA_CFDI_ENDPOINT, finkok_endpoints_constants_1.SAT_SOAP_ACTIONS.consulta, envelope, 60_000);
        const codigoEstatus = this.extractTag(body, 'CodigoEstatus');
        const estado = this.extractTag(body, 'Estado');
        return {
            success: Boolean(estado),
            source: 'sat',
            codigoEstatus,
            esCancelable: this.extractTag(body, 'EsCancelable'),
            estado,
            estatusCancelacion: this.extractTag(body, 'EstatusCancelacion'),
            validacionEfos: this.extractTag(body, 'ValidacionEFOS'),
            rawResponse: body,
        };
    }
    parseResellerUsers(body) {
        const blocks = body.match(/<(?:\w+:)?ResellerUser>[\s\S]*?<\/(?:\w+:)?ResellerUser>/gi) ?? [];
        return blocks.map((block) => ({
            status: this.extractTag(block, 'status'),
            counter: Number(this.extractTag(block, 'counter') ?? NaN) || undefined,
            taxpayer_id: this.extractTag(block, 'taxpayer_id'),
            credit: Number(this.extractTag(block, 'credit') ?? NaN) || undefined,
        }));
    }
    async registrationGet(credentials, taxpayerId) {
        const url = finkok_endpoints_constants_1.FINKOK_REGISTRATION_ENDPOINT[credentials.environment];
        this.logger.debug(`Registration get → ${url} RFC ${taxpayerId}`);
        let body = '';
        let message;
        let users = [];
        for (const credNodes of this.registrationCredentialAttempts(credentials)) {
            const envelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:reg="${finkok_endpoints_constants_1.FINKOK_REGISTRATION_NAMESPACE}">
  <soapenv:Header/>
  <soapenv:Body>
    <reg:get>
      ${credNodes}
      <reg:taxpayer_id>${this.escapeXml(taxpayerId)}</reg:taxpayer_id>
    </reg:get>
  </soapenv:Body>
</soapenv:Envelope>`;
            body = await this.postSoap(url, finkok_endpoints_constants_1.FINKOK_SOAP_ACTIONS.registration_get, envelope, 60_000);
            message = this.extractTag(body, 'message') ?? this.extractTag(body, 'faultstring');
            users = this.parseResellerUsers(body);
            if (!this.isAuthenticationFailedMessage(message)) {
                break;
            }
        }
        const matched = users.filter((u) => u.taxpayer_id?.toUpperCase() === taxpayerId.toUpperCase());
        return {
            found: matched.length > 0,
            message,
            users: matched,
            rawResponse: body,
        };
    }
    async registrationAdd(credentials, input) {
        const url = finkok_endpoints_constants_1.FINKOK_REGISTRATION_ENDPOINT[credentials.environment];
        this.logger.debug(`Registration add → ${url} RFC ${input.taxpayerId}`);
        let body = '';
        let message;
        let success = false;
        for (const credNodes of this.registrationCredentialAttempts(credentials)) {
            const envelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:reg="${finkok_endpoints_constants_1.FINKOK_REGISTRATION_NAMESPACE}">
  <soapenv:Header/>
  <soapenv:Body>
    <reg:add>
      ${credNodes}
      <reg:taxpayer_id>${this.escapeXml(input.taxpayerId)}</reg:taxpayer_id>
      <reg:type_user>${this.escapeXml(input.typeUser ?? 'O')}</reg:type_user>
      <reg:cer>${input.cerBase64}</reg:cer>
      <reg:key>${input.keyBase64}</reg:key>
      <reg:passphrase>${this.escapeXml(input.passphrase)}</reg:passphrase>
    </reg:add>
  </soapenv:Body>
</soapenv:Envelope>`;
            body = await this.postSoap(url, finkok_endpoints_constants_1.FINKOK_SOAP_ACTIONS.registration_add, envelope, 120_000);
            message = this.extractTag(body, 'message') ?? this.extractTag(body, 'faultstring');
            const successRaw = (this.extractTag(body, 'success') ?? '').toLowerCase();
            success =
                (successRaw === 'true' || successRaw === '1') &&
                    !this.isAuthenticationFailedMessage(message);
            if (!this.isAuthenticationFailedMessage(message)) {
                break;
            }
        }
        return { success, message, rawResponse: body };
    }
};
exports.FinkokSoapClient = FinkokSoapClient;
exports.FinkokSoapClient = FinkokSoapClient = FinkokSoapClient_1 = __decorate([
    (0, common_1.Injectable)()
], FinkokSoapClient);
//# sourceMappingURL=finkok-soap.client.js.map