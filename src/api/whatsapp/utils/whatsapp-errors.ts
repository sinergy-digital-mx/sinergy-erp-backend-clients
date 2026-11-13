import {
  BadGatewayException,
  BadRequestException,
  HttpException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { WahaError } from '../services/waha-client.service';

export const WHATSAPP_NOT_CONNECTED_MESSAGE =
  'WhatsApp no está conectado. Escanea el código QR en Configuración.';

export function friendlyWahaMessage(error: unknown): string {
  if (!(error instanceof WahaError)) return 'No se pudo comunicar con WhatsApp.';
  if (error.status === 401 || error.status === 403) {
    return 'El servicio de WhatsApp rechazó la conexión. Contacta a soporte.';
  }
  if (error.status === 503) return error.message;
  if (error.status === 429) {
    return 'WhatsApp limitó la consulta. Espera un momento e inténtalo de nuevo.';
  }
  if (error.isSessionUnavailable) return WHATSAPP_NOT_CONNECTED_MESSAGE;
  return 'No se pudo comunicar con WhatsApp.';
}

export function toHttpException(error: unknown): HttpException {
  if (error instanceof HttpException) return error;
  const message = friendlyWahaMessage(error);
  if (error instanceof WahaError) {
    if (error.status === 503) return new ServiceUnavailableException(message);
    if (error.isSessionUnavailable) return new BadRequestException(message);
  }
  return new BadGatewayException(message);
}
