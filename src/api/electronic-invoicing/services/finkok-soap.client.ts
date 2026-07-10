import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { FinkokEnvironment } from '../../../entities/electronic-invoicing/finkok-provider-configuration.entity';
import {
  FINKOK_CANCEL_ENDPOINT,
  FINKOK_CANCEL_NAMESPACE,
  FINKOK_APPS_NAMESPACE,
  FINKOK_REGISTRATION_ENDPOINT,
  FINKOK_REGISTRATION_NAMESPACE,
  FINKOK_SOAP_ACTIONS,
  FINKOK_STAMP_ENDPOINT,
  FINKOK_STAMP_NAMESPACE,
  SAT_CONSULTA_CFDI_ENDPOINT,
  SAT_CONSULTA_NAMESPACE,
  SAT_SOAP_ACTIONS,
} from '../constants/finkok-endpoints.constants';

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

const STAMP_SUCCESS = 'Comprobante timbrado satisfactoriamente';

@Injectable()
export class FinkokSoapClient {
  private readonly logger = new Logger(FinkokSoapClient.name);

  private escapeXml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private extractTag(xml: string, tag: string): string | undefined {
    const cdataMatch = new RegExp(
      `<(?:\\w+:)?${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></(?:\\w+:)?${tag}>`,
      'i',
    ).exec(xml);
    if (cdataMatch) {
      return cdataMatch[1].trim();
    }

    const simpleMatch = new RegExp(`<(?:\\w+:)?${tag}>([^<]*)</(?:\\w+:)?${tag}>`, 'i').exec(xml);
    return simpleMatch?.[1]?.trim();
  }

  private extractSatBlock(body: string): string {
    const satBlock = body.match(/<(?:\w+:)?sat>[\s\S]*?<\/(?:\w+:)?sat>/i)?.[0];
    return satBlock ?? body;
  }

  private async postSoap(
    url: string,
    soapAction: string,
    envelope: string,
    timeoutMs: number,
  ): Promise<string> {
    const response = await axios.post(url, envelope, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        SOAPAction: soapAction,
      },
      timeout: timeoutMs,
    });
    return String(response.data);
  }

  async signStamp(credentials: FinkokCredentials, xmlContent: string): Promise<FinkokStampResult> {
    const xmlBase64 = Buffer.from(xmlContent, 'utf8').toString('base64');
    const envelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:stam="${FINKOK_STAMP_NAMESPACE}">
  <soapenv:Header/>
  <soapenv:Body>
    <stam:sign_stamp>
      <stam:xml>${this.escapeXml(xmlBase64)}</stam:xml>
      <stam:username>${this.escapeXml(credentials.username)}</stam:username>
      <stam:password>${this.escapeXml(credentials.password)}</stam:password>
    </stam:sign_stamp>
  </soapenv:Body>
</soapenv:Envelope>`;

    const url = FINKOK_STAMP_ENDPOINT[credentials.environment];
    this.logger.debug(`Sign_Stamp → ${url}`);

    const body = await this.postSoap(url, FINKOK_SOAP_ACTIONS.sign_stamp, envelope, 120_000);

    const codEstatus = this.extractTag(body, 'CodEstatus');
    const stampedXml = this.extractTag(body, 'xml');
    const uuid = this.extractTag(body, 'UUID');
    const fecha = this.extractTag(body, 'Fecha');
    const satSeal = this.extractTag(body, 'SatSeal');
    const noCertificadoSat = this.extractTag(body, 'NoCertificadoSAT');
    const incidencias = this.parseIncidencias(body);

    const success =
      codEstatus === STAMP_SUCCESS ||
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

  private parseIncidencias(body: string): FinkokIncidencia[] {
    const blocks = body.match(/<(?:\w+:)?Incidencia>[\s\S]*?<\/(?:\w+:)?Incidencia>/gi) ?? [];
    return blocks.map((block) => ({
      idIncidencia: this.extractTag(block, 'IdIncidencia'),
      codigoError: this.extractTag(block, 'CodigoError'),
      mensajeIncidencia: this.extractTag(block, 'MensajeIncidencia'),
      extraInfo: this.extractTag(block, 'ExtraInfo'),
      fechaRegistro: this.extractTag(block, 'FechaRegistro'),
    }));
  }

  async signCancel(
    credentials: FinkokCredentials,
    taxpayerId: string,
    certificateSerial: string,
    uuids: FinkokCancelUuidInput[],
    storePending = false,
  ): Promise<FinkokCancelResult> {
    const uuidNodes = uuids
      .map(
        (item) =>
          `<apps:UUID UUID="${this.escapeXml(item.uuid)}" FolioSustitucion="${this.escapeXml(item.folioSustitucion ?? '')}" Motivo="${this.escapeXml(item.motivo)}"/>`,
      )
      .join('');

    const envelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:can="${FINKOK_CANCEL_NAMESPACE}" xmlns:apps="${FINKOK_APPS_NAMESPACE}">
  <soapenv:Header/>
  <soapenv:Body>
    <can:sign_cancel>
      <can:UUIDS>${uuidNodes}</can:UUIDS>
      <can:username>${this.escapeXml(credentials.username)}</can:username>
      <can:password>${this.escapeXml(credentials.password)}</can:password>
      <can:taxpayer_id>${this.escapeXml(taxpayerId)}</can:taxpayer_id>
      <can:serial>${this.escapeXml(certificateSerial)}</can:serial>
      <can:store_pending>${storePending}</can:store_pending>
    </can:sign_cancel>
  </soapenv:Body>
</soapenv:Envelope>`;

    const url = FINKOK_CANCEL_ENDPOINT[credentials.environment];
    this.logger.debug(`Sign_Cancel → ${url}`);

    const body = await this.postSoap(url, FINKOK_SOAP_ACTIONS.sign_cancel, envelope, 120_000);
    const codEstatus = this.extractTag(body, 'CodEstatus');

    const folioBlocks = body.match(/<(?:\w+:)?Folio>[\s\S]*?<\/(?:\w+:)?Folio>/gi) ?? [];
    const folios: FinkokCancelFolioResult[] = folioBlocks.map((block) => ({
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

  /**
   * Consulta estatus vía Finkok cancel service (get_sat_status).
   * Usa las credenciales del cliente; alternativa al WS directo del SAT.
   */
  async getSatStatusFinkok(
    credentials: FinkokCredentials,
    rfcEmisor: string,
    rfcReceptor: string,
    total: string,
    uuid: string,
  ): Promise<SatCfdiConsultaResult> {
    const envelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:can="${FINKOK_CANCEL_NAMESPACE}">
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

    const url = FINKOK_CANCEL_ENDPOINT[credentials.environment];
    this.logger.debug(`Get_sat_status (Finkok) → ${url}`);

    const body = await this.postSoap(url, FINKOK_SOAP_ACTIONS.get_sat_status, envelope, 60_000);
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

  /** Consulta estatus directo al WebService del SAT */
  async consultSatCfdi(
    rfcEmisor: string,
    rfcReceptor: string,
    total: string,
    uuid: string,
  ): Promise<SatCfdiConsultaResult> {
    const expresionImpresa = `?re=${rfcEmisor}&rr=${rfcReceptor}&tt=${total}&id=${uuid}`;
    const envelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="${SAT_CONSULTA_NAMESPACE}">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:Consulta>
      <tem:expresionImpresa>${this.escapeXml(expresionImpresa)}</tem:expresionImpresa>
    </tem:Consulta>
  </soapenv:Body>
</soapenv:Envelope>`;

    this.logger.debug(`ConsultaCFDI (SAT) → ${SAT_CONSULTA_CFDI_ENDPOINT}`);

    const body = await this.postSoap(
      SAT_CONSULTA_CFDI_ENDPOINT,
      SAT_SOAP_ACTIONS.consulta,
      envelope,
      60_000,
    );

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

  private parseResellerUsers(body: string): Array<{
    status?: string;
    counter?: number;
    taxpayer_id?: string;
    credit?: number;
  }> {
    const blocks = body.match(/<(?:\w+:)?ResellerUser>[\s\S]*?<\/(?:\w+:)?ResellerUser>/gi) ?? [];
    return blocks.map((block) => ({
      status: this.extractTag(block, 'status'),
      counter: Number(this.extractTag(block, 'counter') ?? NaN) || undefined,
      taxpayer_id: this.extractTag(block, 'taxpayer_id'),
      credit: Number(this.extractTag(block, 'credit') ?? NaN) || undefined,
    }));
  }

  /**
   * Registration get — consulta si el RFC emisor ya está registrado en la cuenta reseller.
   * WSDL: https://demo-facturacion.finkok.com/servicios/soap/registration.wsdl
   */
  async registrationGet(
    credentials: FinkokCredentials,
    taxpayerId: string,
  ): Promise<{
    found: boolean;
    message?: string;
    users: Array<{
      status?: string;
      counter?: number;
      taxpayer_id?: string;
      credit?: number;
    }>;
    rawResponse?: string;
  }> {
    const envelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:reg="${FINKOK_REGISTRATION_NAMESPACE}">
  <soapenv:Header/>
  <soapenv:Body>
    <reg:get>
      <reg:reseller_username>${this.escapeXml(credentials.username)}</reg:reseller_username>
      <reg:reseller_password>${this.escapeXml(credentials.password)}</reg:reseller_password>
      <reg:taxpayer_id>${this.escapeXml(taxpayerId)}</reg:taxpayer_id>
    </reg:get>
  </soapenv:Body>
</soapenv:Envelope>`;

    const url = FINKOK_REGISTRATION_ENDPOINT[credentials.environment];
    this.logger.debug(`Registration get → ${url} RFC ${taxpayerId}`);

    const body = await this.postSoap(url, FINKOK_SOAP_ACTIONS.registration_get, envelope, 60_000);
    const message = this.extractTag(body, 'message');
    const users = this.parseResellerUsers(body);
    const matched = users.filter(
      (u) => u.taxpayer_id?.toUpperCase() === taxpayerId.toUpperCase(),
    );

    return {
      found: matched.length > 0,
      message,
      users: matched.length > 0 ? matched : users,
      rawResponse: body,
    };
  }

  /**
   * Registration add — registra un emisor nuevo bajo la cuenta reseller.
   * Si el RFC ya existe en Finkok, fallará; usar registrationGet + link en ese caso.
   */
  async registrationAdd(
    credentials: FinkokCredentials,
    input: {
      taxpayerId: string;
      cerBase64: string;
      keyBase64: string;
      passphrase: string;
      typeUser?: string;
    },
  ): Promise<{ success: boolean; message?: string; rawResponse?: string }> {
    const envelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:reg="${FINKOK_REGISTRATION_NAMESPACE}">
  <soapenv:Header/>
  <soapenv:Body>
    <reg:add>
      <reg:reseller_username>${this.escapeXml(credentials.username)}</reg:reseller_username>
      <reg:reseller_password>${this.escapeXml(credentials.password)}</reg:reseller_password>
      <reg:taxpayer_id>${this.escapeXml(input.taxpayerId)}</reg:taxpayer_id>
      <reg:type_user>${this.escapeXml(input.typeUser ?? 'O')}</reg:type_user>
      <reg:cer>${input.cerBase64}</reg:cer>
      <reg:key>${input.keyBase64}</reg:key>
      <reg:passphrase>${this.escapeXml(input.passphrase)}</reg:passphrase>
    </reg:add>
  </soapenv:Body>
</soapenv:Envelope>`;

    const url = FINKOK_REGISTRATION_ENDPOINT[credentials.environment];
    this.logger.debug(`Registration add → ${url} RFC ${input.taxpayerId}`);

    const body = await this.postSoap(url, FINKOK_SOAP_ACTIONS.registration_add, envelope, 120_000);
    const message = this.extractTag(body, 'message');
    const successRaw = this.extractTag(body, 'success');
    const success = successRaw === 'true' || successRaw === '1';

    return { success, message, rawResponse: body };
  }
}
