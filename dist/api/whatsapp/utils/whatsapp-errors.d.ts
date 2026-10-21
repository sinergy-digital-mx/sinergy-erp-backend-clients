import { HttpException } from '@nestjs/common';
export declare const WHATSAPP_NOT_CONNECTED_MESSAGE = "WhatsApp no est\u00E1 conectado. Escanea el c\u00F3digo QR en Configuraci\u00F3n.";
export declare function friendlyWahaMessage(error: unknown): string;
export declare function toHttpException(error: unknown): HttpException;
