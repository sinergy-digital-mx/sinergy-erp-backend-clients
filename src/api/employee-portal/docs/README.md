# Portal de empleado

## Historial

- 2026-10-29: Horario laboral semanal en `GET /me` (`work_schedule`) y `PUT /me/work-schedule`.
- 2026-10-27: El empleado solicita horas extras en `GET/POST /me/overtime-requests` y puede corregir una pendiente con `PUT /me/overtime-requests/:requestId`.
- 2026-10-26: Comprobantes de incapacidad médica en `POST/DELETE /me/leave-requests/:requestId/documents`. El perfil incluye `sick_leave`.

Autoservicio para usuarios de tipo **empleado**. Desde configuración, un usuario con perfil de empleado puede ver su información, actualizar su nombre/teléfono/contraseña, subir su foto, consultar sus días de vacaciones disponibles y meter/cancelar solicitudes.

- Solo accesible para usuarios que tengan perfil de empleado (`is_employee = true`). Si un usuario sin perfil de empleado accede, recibe `403`.
- Reutiliza los servicios del módulo **Empleados** (`EmployeesService`, `EmployeeLeaveService`), operando siempre sobre el empleado del usuario autenticado.

## Estructura

```
src/api/employee-portal/
├── dto/
│   └── update-my-profile.dto.ts
├── docs/
│   ├── README.md
│   └── UI_GUIDE.md
├── employee-portal.constants.ts
├── employee-portal.controller.ts
├── employee-portal.service.ts
└── employee-portal.module.ts

src/database/seeds/seed-employee-portal-module.ts
```

## RBAC

- Módulo: `employee_portal`
- Entidad (entityType): `EmployeePortal`
- Acciones: `ViewMenu`, `Read`, `Update`, `RequestLeave`

Se recomienda crear un rol **Empleado** con estos permisos y asignarlo a los usuarios de tipo empleado. Además del permiso RBAC, el backend valida que el usuario tenga perfil de empleado.

## Endpoints

Prefijo: `tenant/employee-portal`

| Método | Ruta                              | Permiso                     | Descripción                                    |
| ------ | --------------------------------- | --------------------------- | ---------------------------------------------- |
| GET    | `/me`                             | `EmployeePortal:Read`       | Mi información (puesto, foto, nómina, vacaciones). |
| PUT    | `/me`                             | `EmployeePortal:Update`     | Actualizar mi nombre, teléfono o contraseña.   |
| POST   | `/me/photo`                       | `EmployeePortal:Update`     | Subir/actualizar mi foto (multipart `file`).   |
| GET    | `/me/leave-requests`              | `EmployeePortal:Read`       | Ver mis solicitudes.                           |
| POST   | `/me/leave-requests`              | `EmployeePortal:RequestLeave` | Solicitar vacaciones / reportar falta.       |
| PUT    | `/me/leave-requests/:requestId/cancel` | `EmployeePortal:RequestLeave` | Cancelar una de mis solicitudes pendientes. |
| POST   | `/me/leave-requests/:requestId/documents` | `EmployeePortal:RequestLeave` | Adjuntar comprobante a mi incapacidad (`file`). |
| DELETE | `/me/leave-requests/:requestId/documents/:documentId` | `EmployeePortal:RequestLeave` | Quitar un comprobante propio. |
| GET    | `/me/overtime-requests`           | `EmployeePortal:Read`         | Ver mis horas extras.                              |
| POST   | `/me/overtime-requests`           | `EmployeePortal:RequestLeave` | Solicitar horas extras.                            |
| PUT    | `/me/overtime-requests/:requestId`| `EmployeePortal:RequestLeave` | Corregir una solicitud pendiente propia.           |
| PUT    | `/me/work-schedule`               | `EmployeePortal:Update`       | Guardar mi horario laboral semanal.                |

## Detección en el login

La respuesta de login incluye `is_employee`. El frontend lo usa para mostrar la opción **Portal de empleado** en configuración.

## Seed

```bash
npm run seed:employee-portal
```
