/** Code del módulo en RBAC. */
export const EMPLOYEE_PORTAL_MODULE_CODE = 'employee_portal';

/** Code de la entidad en el registro RBAC (entityType para permisos). */
export const EMPLOYEE_PORTAL_ENTITY_CODE = 'EmployeePortal';

/** Acciones RBAC del Portal de empleado. */
export const EMPLOYEE_PORTAL_ACTIONS = [
  'ViewMenu',
  'Read', // ver mi información
  'Update', // actualizar mi perfil / foto / contraseña
  'RequestLeave', // solicitar vacaciones / reportar faltas
];
