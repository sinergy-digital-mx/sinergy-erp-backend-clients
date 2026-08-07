/** Code del módulo en RBAC. */
export const EMPLOYEES_MODULE_CODE = 'employees';

/** Code de la entidad en el registro RBAC (entityType para permisos). */
export const EMPLOYEES_ENTITY_CODE = 'Employee';

/** Acciones RBAC del módulo Empleados. */
export const EMPLOYEES_ACTIONS = [
  'ViewMenu',
  'Create',
  'Read',
  'Update',
  'Delete',
  'ManageLeave', // aprobar/rechazar solicitudes de vacaciones/faltas
];
