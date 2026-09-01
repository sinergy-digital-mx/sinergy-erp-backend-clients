# Empleados

Módulo de Recursos Humanos. Gestiona el perfil laboral/nómina de los usuarios marcados como **empleados**, sus **vacaciones** (calculadas según la Ley Federal del Trabajo) y sus **solicitudes** de vacaciones/faltas.

- Un empleado siempre está ligado 1:1 a un `User` del sistema (`user_id` único).
- El perfil de empleado se puede crear/editar desde el **modal de usuario** (tab "Empleado") o desde este módulo.
- Las vacaciones se calculan automáticamente con base en la `hire_date` (antigüedad) y el art. 76 LFT (reforma 2023).
- La nómina deriva del `monthly_salary`: diario, quincenal, semanal, anual y Salario Diario Integrado (SDI).

## Estructura

```
src/api/employees/
├── dto/
│   ├── employee-profile.dto.ts      # datos RH/nómina (reusado por el modal de usuario)
│   ├── create-employee.dto.ts
│   ├── update-employee.dto.ts
│   ├── query-employee.dto.ts
│   ├── create-leave-request.dto.ts  # reusado por el Portal
│   ├── update-leave-request.dto.ts
│   ├── review-leave-request.dto.ts
│   └── query-leave-request.dto.ts
├── docs/
│   ├── README.md
│   └── UI_GUIDE.md
├── utils/
│   └── mexican-labor-law.ts         # cálculo LFT vacaciones + nómina
├── employees.constants.ts
├── employees.controller.ts
├── employees.service.ts
├── employee-leave.service.ts
└── employees.module.ts

src/entities/employees/
├── employee.entity.ts
├── employee-leave-request.entity.ts
├── employee-status.enum.ts
├── employee-payment-frequency.enum.ts
├── leave-type.enum.ts
└── leave-status.enum.ts

src/database/migrations/1784700000000-create-employees-table.ts
src/database/migrations/1784700100000-create-employee-leave-requests-table.ts
src/database/migrations/1784700200000-add-is-employee-to-users.ts
src/database/migrations/1788000000000-add-vacation-carryover-days.ts
src/database/seeds/seed-employees-module.ts
```

## RBAC

- Módulo: `employees`
- Entidad (entityType): `Employee`
- Acciones: `ViewMenu`, `Create`, `Read`, `Update`, `Delete`, `ManageLeave`

`ManageLeave` controla aprobar/rechazar/cancelar solicitudes. Habilitado para todos los clientes activos.

## Endpoints

Prefijo: `tenant/employees`

| Método | Ruta                                  | Permiso              | Descripción                                        |
| ------ | ------------------------------------- | -------------------- | -------------------------------------------------- |
| POST   | `/`                                   | `Employee:Create`    | Crear perfil de empleado ligado a un `user_id`.    |
| GET    | `/`                                   | `Employee:Read`      | Listado con búsqueda, filtros y vacaciones.        |
| GET    | `/:id`                                | `Employee:Read`      | Detalle (nómina, vacaciones, solicitudes).         |
| PUT    | `/:id`                                | `Employee:Update`    | Actualizar datos de RH/nómina.                     |
| DELETE | `/:id`                                | `Employee:Delete`    | Eliminar el perfil de empleado.                    |
| POST   | `/:id/photo`                          | `Employee:Update`    | Subir/actualizar foto (multipart `file`).          |
| GET    | `/leave-requests/all`                 | `Employee:Read`      | Todas las solicitudes de la organización.          |
| GET    | `/:id/leave-requests`                 | `Employee:Read`      | Solicitudes de un empleado.                        |
| POST   | `/:id/leave-requests`                 | `Employee:Update`    | Registrar solicitud a nombre de un empleado.       |
| PUT    | `/leave-requests/:requestId`          | `Employee:Update`    | Corregir fechas o días de una solicitud.           |
| PUT    | `/leave-requests/:requestId/review`   | `Employee:ManageLeave` | Aprobar o rechazar una solicitud.                |
| PUT    | `/leave-requests/:requestId/cancel`   | `Employee:ManageLeave` | Cancelar una solicitud pendiente.                |

## Campos del empleado

- Identidad/fiscal: `employee_code`, `rfc`, `curp`, `nss`.
- Puesto: `position`, `department`.
- Fechas: `hire_date` (antigüedad), `birth_date`, `termination_date`.
- Vacaciones extra: `vacation_carryover_days` (arrastre del año anterior; lo captura RH).
- Nómina: `monthly_salary`, `payment_frequency` (`monthly`/`biweekly`/`weekly`), `bank_name`, `clabe`, `bank_account`.
- Otros: `status` (`active`/`inactive`/`terminated`), `photo_s3_key` (se sirve como `photo_url` firmada).

## Cálculo de vacaciones (LFT art. 76, reforma 2023)

Días que corresponden según años cumplidos de antigüedad:

| Años | Días |
| ---- | ---- |
| 1    | 12   |
| 2    | 14   |
| 3    | 16   |
| 4    | 18   |
| 5    | 20   |
| 6–10 | 22   |
| 11–15| 24   |
| 16–20| 26   |
| ...  | +2 cada 5 años |

El backend devuelve un objeto `vacation` por empleado:

```json
{
  "years_of_service": 3,
  "entitled_days": 16,
  "carryover_days": 4,
  "balance_days": 20,
  "taken_days": 5,
  "pending_days": 2,
  "available_days": 13,
  "current_period_start": "2026-02-01"
}
```

- `entitled_days`: días de ley del periodo vigente.
- `carryover_days`: días extra / no tomados el año anterior (`vacation_carryover_days`). RH los captura; no se calculan solos.
- `taken_days`: vacaciones **aprobadas** dentro del periodo (año laboral) vigente.
- `pending_days`: vacaciones en solicitudes **pendientes** del periodo vigente.
- `available_days`: `entitled_days + carryover_days − taken_days − pending_days` (nunca negativo).

## Cálculo de nómina

Deriva del `monthly_salary`. El SDI usa el factor de integración = `1 + (15 + díasVacaciones·0.25) / 365` (aguinaldo mínimo 15 días + prima vacacional 25%).

```json
{
  "monthly_salary": 20000,
  "daily_salary": 666.67,
  "biweekly_salary": 10000,
  "weekly_salary": 4615.38,
  "annual_salary": 240000,
  "integration_factor": 1.0452,
  "integrated_daily_salary": 696.79
}
```

## Solicitudes (vacaciones / faltas)

- Tipos (`type`): `vacation`, `absence`, `permission`, `sick_leave`.
- Estatus (`status`): `pending`, `approved`, `rejected`, `cancelled`.
- En `vacation`, `days` = días hábiles (lun–vie). El resto de tipos usa días naturales.
- RH puede mandar `days` o `count_weekends` para controlar el conteo, y corregir una solicitud existente con `PUT /leave-requests/:requestId`.
- Al crear o editar una solicitud de `vacation` se valida que no exceda los `available_days`.

## Migración y seed

```bash
npm run migration:run
npm run seed:employees
```
