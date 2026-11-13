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
  'ManageLeave', // aprobar/rechazar solicitudes de vacaciones/faltas/horas extras
  'ViewOwn',
];

export const EMPLOYEES_ACTION_DESCRIPTIONS: Record<string, string> = {
  ViewMenu: 'Ver Empleados en el menú',
  Create: 'Crear empleados',
  Read: 'Ver todos los empleados, su salario y sus solicitudes',
  Update: 'Actualizar datos de empleados y registrar solicitudes a su nombre',
  Delete: 'Eliminar empleados',
  ManageLeave: 'Aprobar o rechazar vacaciones, ausencias y horas extras',
  ViewOwn: 'Ver solo mi expediente, mi salario y solicitar vacaciones u horas extras',
};
