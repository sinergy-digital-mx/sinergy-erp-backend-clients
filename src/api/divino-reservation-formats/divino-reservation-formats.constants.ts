/**
 * Constantes del módulo Formatos de Reservación Divino.
 * Módulo exclusivo del cliente Divino (prefijo divino_).
 */

/** Tenant único autorizado para este módulo. */
export const DIVINO_RESERVATION_ALLOWED_TENANT_ID =
  '54481b63-5516-458d-9bb3-d4e5cb028864';

/** Code del módulo en RBAC. */
export const DIVINO_RESERVATION_MODULE_CODE = 'divino_reservation_formats';

/** Code de la entidad en el registro RBAC (entityType para permisos). */
export const DIVINO_RESERVATION_ENTITY_CODE = 'DivinoReservationFormat';

/** Datos de contacto/redes fijos del formato Divino (encabezado y pie). */
export const DIVINO_RESERVATION_BRAND = {
  address: 'Ctra. escénica Tij-Eda Km 77.5, Ens, B.C.',
  email: 'info@valledivino.mx',
  phone: '+52 (646) 155 0186',
  website: 'WWW.GIVELIVING.MX',
  facebook: '/ValleDivinoBAJA',
  instagram: '@ValleDivinoMX',
  defaultPayableTo: 'Valdetierra SA de CV',
  projectName: 'Divino',
  projectLocation:
    'KM 77 de la carretera escénica Tijuana - Ensenada, Baja California, México',
} as const;
