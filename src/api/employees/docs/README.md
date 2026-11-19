# Empleados

## Historial

- 2026-10-29: Horario laboral semanal por empleado (`work_schedule`). RH lo guarda con `PUT /:id/work-schedule`. El empleado lo ve y lo guarda en el portal (`PUT /me/work-schedule`).
- 2026-10-27: Solicitudes de horas extras. El empleado captura fecha, horario, motivo y observaciones; el sistema calcula las horas. RH aprueba (puede autorizar otras horas), rechaza o marca como pagada. El importe usa el salario y las reglas de `GET/PUT /overtime/policy`.
- 2026-10-26: Sección de incapacidad médica. El detalle incluye `sick_leave` (días aprobados y en revisión del año) y cada solicitud puede traer `documents`. Comprobantes: `POST/DELETE /leave-requests/:requestId/documents`.

Módulo de Recursos Humanos. Gestiona el perfil laboral/nómina de los usuarios marcados como **empleados**, sus **vacaciones** (calculadas según la Ley Federal del Trabajo), sus **solicitudes** de vacaciones/faltas y sus **horas extras**.

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
│   ├── query-leave-request.dto.ts
│   ├── create-overtime-request.dto.ts
│   ├── update-overtime-request.dto.ts
│   ├── review-overtime-request.dto.ts
│   ├── preview-overtime-request.dto.ts
│   ├── query-overtime-request.dto.ts
│   ├── upsert-overtime-policy.dto.ts
│   └── upsert-work-schedule.dto.ts
├── docs/
│   ├── README.md
│   └── UI_GUIDE.md
├── utils/
│   ├── mexican-labor-law.ts         # cálculo LFT vacaciones + nómina
│   ├── overtime-pay.util.ts         # horas extras y pago (LFT arts. 66-68)
│   └── work-schedule.util.ts        # horario semanal lun–dom
├── employees.constants.ts
├── employees.controller.ts
├── employees.service.ts
├── employee-leave.service.ts
├── employee-overtime.service.ts
├── employee-overtime.controller.ts
└── employees.module.ts

src/entities/employees/
├── employee.entity.ts
├── employee-leave-request.entity.ts
├── employee-overtime-request.entity.ts
├── employee-overtime-policy.entity.ts
├── employee-status.enum.ts
├── employee-payment-frequency.enum.ts
├── leave-type.enum.ts
├── leave-status.enum.ts
└── overtime-status.enum.ts

src/database/migrations/1784700000000-create-employees-table.ts
src/database/migrations/1784700100000-create-employee-leave-requests-table.ts
src/database/migrations/1784700200000-add-is-employee-to-users.ts
src/database/migrations/1788000000000-add-vacation-carryover-days.ts
src/database/migrations/1794300000000-create-employee-overtime.ts
src/database/migrations/1794500000000-add-work-schedule-to-employees.ts
src/database/seeds/seed-employees-module.ts
```

## RBAC

- Módulo: `employees`
- Entidad (entityType): `Employee`
- Acciones: `ViewMenu`, `Create`, `Read`, `Update`, `Delete`, `ManageLeave`

`ManageLeave` controla aprobar, rechazar o marcar como pagadas las solicitudes de vacaciones, ausencias y horas extras.

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
| PUT    | `/:id/work-schedule`                  | `Employee:Update`    | Guardar horario lun–dom (entrada/salida o descanso). |
| GET    | `/leave-requests/all`                 | `Employee:Read`      | Todas las solicitudes de la organización.          |
| GET    | `/:id/leave-requests`                 | `Employee:Read`      | Solicitudes de un empleado.                        |
| POST   | `/:id/leave-requests`                 | `Employee:Update`    | Registrar solicitud a nombre de un empleado.       |
| PUT    | `/leave-requests/:requestId`          | `Employee:Update`    | Corregir fechas o días de una solicitud.           |
| PUT    | `/leave-requests/:requestId/review`   | `Employee:ManageLeave` | Aprobar o rechazar una solicitud.                |
| PUT    | `/leave-requests/:requestId/cancel`   | `Employee:ManageLeave` | Cancelar una solicitud pendiente.                |
| POST   | `/leave-requests/:requestId/documents` | `Employee:Update` o `ViewOwn` | Adjuntar comprobante médico (`file`, máx. 10 MB). |
| DELETE | `/leave-requests/:requestId/documents/:documentId` | `Employee:Update` o `ViewOwn` | Quitar un comprobante. |
| GET    | `/overtime/policy`                    | `Employee:Read`      | Reglas de pago. Si no hay configuración, aplica la LFT. |
| PUT    | `/overtime/policy`                    | `Employee:Update`    | Guardar jornada, topes y multiplicadores. |
| GET    | `/overtime-requests/all`              | `Employee:Read`      | Horas extras de la organización. |
| GET    | `/:id/overtime-requests`              | `Employee:Read` o `ViewOwn` | Horas extras de un empleado. |
| POST   | `/:id/overtime-requests`              | `Employee:Update` o `ViewOwn` | Registrar una solicitud. Las horas se calculan. |
| PUT    | `/overtime-requests/:requestId`       | `Employee:Update` o `ViewOwn` | Corregir una solicitud pendiente. |
| GET    | `/overtime-requests/:requestId/preview` | `Employee:ManageLeave` | Calcular el importe sin guardar. |
| PUT    | `/overtime-requests/:requestId/review` | `Employee:ManageLeave` | Aprobar o rechazar. Se pueden autorizar otras horas. |
| PUT    | `/overtime-requests/:requestId/pay`   | `Employee:ManageLeave` | Marcar como pagada una solicitud aprobada. |

## Campos del empleado

- Identidad/fiscal: `employee_code`, `rfc`, `curp`, `nss`.
- Puesto: `position`, `department`.
- Fechas: `hire_date` (antigüedad), `birth_date`, `termination_date`.
- Vacaciones extra: `vacation_carryover_days` (arrastre del año anterior; lo captura RH).
- Nómina: `monthly_salary`, `payment_frequency` (`monthly`/`biweekly`/`weekly`), `bank_name`, `clabe`, `bank_account`.
- Otros: `status` (`active`/`inactive`/`terminated`), `photo_s3_key` (se sirve como `photo_url` firmada).
- Horario: `work_schedule` (`days[]` lun–dom, `weekly_hours`, `notes`). Null si no se ha configurado.

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

## Incapacidad médica (2026-10-26)

En el detalle del empleado, junto a vacaciones, el objeto `sick_leave` cuenta el año calendario (hora de Ciudad de México):

```json
{
  "year": 2026,
  "approved_days": 3,
  "pending_days": 0.5,
  "request_count": 2
}
```

- `approved_days`: incapacidades aprobadas que caen en ese año. Si el rango cabe en el año, se usa `days` (incluye medios días). Si cruza el 1 de enero, solo cuentan los días de ese año.
- `pending_days`: lo mismo, en solicitudes pendientes.
- Rechazadas y canceladas no suman.

Cada solicitud de `sick_leave` incluye `documents[]` con `id`, `file_name`, `mime_type`, `file_size`, `url` (firmada, 6 horas) y `created_at`. PDF o imagen, máximo 8 por solicitud y 10 MB cada uno. Solo en incapacidades pendientes o aprobadas.

## Horas extras (2026-10-27)

El empleado (o RH a su nombre) envía:

```json
{
  "work_date": "2026-10-26",
  "start_time": "18:00",
  "end_time": "21:30",
  "reason": "Cierre de inventario",
  "notes": "Se quedó el turno de noche"
}
```

`requested_hours` sale del horario (3.5 en el ejemplo). Si el término es menor que el inicio, el turno cruza la medianoche. La fecha no puede ser futura ni empalmarse con otra solicitud vigente del mismo empleado. `notes` es opcional.

Estatus: `pending`, `approved`, `rejected`, `paid`.

Cada fila trae al empleado (puesto, salario mensual, salario diario y tarifa por hora), `reviewer_name`, `reviewed_at`, `review_notes`, `payer_name`, `paid_at` y `paid_amount`.

Al aprobar:

```json
{
  "status": "approved",
  "approved_hours": 3,
  "review_notes": "Se autorizan 3 de 3.5"
}
```

Si no se manda `approved_hours`, se autorizan las solicitadas. El importe se congela con el salario y las reglas vigentes:

- Tarifa por hora = (`monthly_salary` / 30) / horas de jornada.
- Las primeras horas del día y de la semana (lunes a domingo) se pagan al doble.
- El resto se paga al triple.
- Las horas ya aprobadas o pagadas de ese día y esa semana consumen el tope.

Reglas por defecto (LFT arts. 66 a 68), reemplazables con `PUT /overtime/policy`:

```json
{
  "workday_hours": 8,
  "daily_double_hours": 3,
  "weekly_double_hours": 9,
  "double_multiplier": 2,
  "excess_multiplier": 3
}
```

`GET /overtime-requests/:requestId/preview?approved_hours=3` devuelve el mismo desglose sin guardar. Una solicitud aprobada se puede volver a revisar antes de pagarla. `PUT /overtime-requests/:requestId/pay` copia `amount` a `paid_amount`.

En el portal del empleado:

```http
GET  /tenant/employee-portal/me/overtime-requests
POST /tenant/employee-portal/me/overtime-requests
PUT  /tenant/employee-portal/me/overtime-requests/:requestId
```

## Migración y seed

```bash
npm run migration:run
npm run seed:employees
```
