# Guía de UI — Empleados

## Historial

- 2026-10-29: El horario se captura en el modal de usuario (tab Empleado, `employee.work_schedule`) y con Editar en el expediente. El empleado lo ve en el portal.
- 2026-10-27: Horas extras. Formulario con fecha, horario y motivo; el total de horas lo calcula el backend. Revisión con horas autorizadas, comentarios e importe. Estatus pendiente, aprobada, rechazada o pagada.
- 2026-10-26: Incapacidad médica en el expediente. Cabecera con días del año (`sick_leave`) y comprobantes en la misma solicitud.

Cómo consumir el módulo desde el frontend. Todos los endpoints requieren:

- Header `Authorization: Bearer <token>`
- Permisos `Employee:*` y el módulo habilitado.

Base URL: `/{apiPrefix}/tenant/employees`

---

## 1. Marcar un usuario como empleado (modal de usuario, tab "Empleado")

El perfil de empleado se administra desde el modal de usuario existente. Al activar el toggle **Empleado**, muestra los campos de RH/nómina (incluido el **horario laboral**) y envíalos dentro del objeto `employee` al crear/editar el usuario.

```http
POST /tenant/users
PUT  /tenant/users/:userId
```

```json
{
  "email": "empleado@empresa.mx",
  "password": "Secreta123",
  "first_name": "Juan",
  "last_name": "Pérez",
  "status_id": 1,

  "is_employee": true,
  "employee": {
    "employee_code": "EMP-001",
    "rfc": "PEPJ900101ABC",
    "curp": "PEPJ900101HDFRRN09",
    "nss": "12345678901",
    "position": "Cajero",
    "department": "Ventas",
    "hire_date": "2022-02-01",
    "birth_date": "1990-01-01",
    "vacation_carryover_days": 4,
    "monthly_salary": 12000,
    "payment_frequency": "biweekly",
    "bank_name": "BBVA",
    "clabe": "012345678901234567",
    "bank_account": "0123456789",
    "work_schedule": {
      "notes": "Turno matutino",
      "days": [
        { "weekday": 1, "is_workday": true, "start_time": "09:00", "end_time": "18:00" },
        { "weekday": 7, "is_workday": false }
      ]
    }
  }
}
```

- Si `is_employee` es `true`, el backend hace **upsert** del perfil y marca al usuario como empleado.
- Si `is_employee` es `false`, se desmarca al usuario (se conserva el historial del empleado).
- La respuesta de `GET /tenant/users/:userId` incluye `is_employee` y el objeto `employee` (con `vacation`, `payroll`, `photo_url` y `work_schedule`) para precargar el modal.

> Alternativa: también puedes crear el empleado directamente con `POST /tenant/employees` enviando `user_id` + los campos anteriores.

## 2. Lista de empleados

```http
GET /tenant/employees?page=1&limit=20&search=juan&status=active&department=Ventas
```

Cada fila incluye el resumen de vacaciones y conteo de solicitudes:

```json
{
  "data": [
    {
      "id": "…",
      "user_id": "…",
      "first_name": "Juan",
      "last_name": "Pérez",
      "email": "empleado@empresa.mx",
      "position": "Cajero",
      "status": "active",
      "photo_url": "https://…firmada",
      "years_of_service": 3,
      "vacation": {
        "years_of_service": 3,
        "entitled_days": 16,
        "carryover_days": 4,
        "balance_days": 20,
        "taken_days": 5,
        "pending_days": 2,
        "available_days": 13,
        "current_period_start": "2025-02-01"
      },
      "payroll": {
        "monthly_salary": 12000,
        "daily_salary": 400,
        "biweekly_salary": 6000,
        "weekly_salary": 2769.23,
        "annual_salary": 144000,
        "integration_factor": 1.0452,
        "integrated_daily_salary": 418.08
      },
      "request_counts": { "total": 7, "pending": 2, "approved": 4, "rejected": 1, "cancelled": 0 }
    }
  ],
  "total": 1, "page": 1, "limit": 20, "totalPages": 1, "hasNext": false, "hasPrev": false
}
```

Columnas sugeridas: **Empleado**, **Puesto**, **Antigüedad**, **Vacaciones disponibles** (`vacation.available_days`), **Solicitudes** (`request_counts.pending` como badge), **Estatus**.

`vacation.entitled_days` = días de ley (art. 76). `vacation.carryover_days` = días extra / no tomados el año anterior; RH los captura en `vacation_carryover_days` (alta/edición de empleado o tab Empleado del usuario). `available_days` = `entitled_days + carryover_days − taken_days − pending_days`.

## 3. Detalle del empleado

```http
GET /tenant/employees/:id
```

Igual que la fila de la lista, más `leave_requests` (historial completo de solicitudes).

## 4. Foto del empleado

```http
POST /tenant/employees/:id/photo
Content-Type: multipart/form-data
```

Campo del archivo: `file`. La respuesta trae el `photo_url` actualizado (URL firmada, expira ~1h).

## 5. Solicitudes de vacaciones/faltas

### Ver todas (vista RH)

```http
GET /tenant/employees/leave-requests/all?status=pending&type=vacation&page=1&limit=20
```

Cada solicitud incluye el empleado (`employee.first_name`, `employee.last_name`, `employee.position`).

### Ver de un empleado

```http
GET /tenant/employees/:id/leave-requests
```

### Registrar a nombre de un empleado

```http
POST /tenant/employees/:id/leave-requests
```

```json
{
  "type": "vacation",
  "start_date": "2026-04-16",
  "end_date": "2026-04-24",
  "reason": "Vacaciones de verano",
  "is_paid": true
}
```

`days` se calcula solo: **vacaciones = días hábiles (lun–vie)**. 16–24 abril = **7**, no 9. Faltas/permisos/incapacidad siguen en días naturales.

RH puede controlar el conteo:

| Campo | Default | Uso |
| ----- | ------- | --- |
| `days` | calculado | Override (medios días o un ajuste puntual). |
| `count_weekends` | `false` en vacation | `true` si esa ausencia sí debe contar sáb/dom. |

Para `vacation` se valida contra `available_days`.

### Corregir una solicitud ya cargada

```http
PUT /tenant/employees/leave-requests/:requestId
```

```json
{ "days": 7 }
```

Sirve para el caso 16–24 abril que quedó en 9: mándalo a 7. Si cambias fechas y no mandas `days`, se recalcula (hábiles en vacation). No aplica a canceladas/rechazadas.

### Aprobar / rechazar

```http
PUT /tenant/employees/leave-requests/:requestId/review
```

```json
{ "status": "approved", "review_notes": "Autorizado" }
```

### Cancelar (pendientes)

```http
PUT /tenant/employees/leave-requests/:requestId/cancel
```

## 8. Incapacidad médica

En el detalle (`GET /tenant/employees/:id`) viene `sick_leave` para la cabecera del año y, dentro de cada solicitud, `documents`.

La solicitud se crea igual que las demás, con `type: "sick_leave"`, fechas y `reason` (comentarios). Los días son naturales. Un solo día puede mandarse como `days: 0.5`.

Adjuntar el comprobante en esa solicitud:

```http
POST /tenant/employees/leave-requests/:requestId/documents
Content-Type: multipart/form-data
```

Campo: `file`. PDF, JPG, PNG o WEBP. Máximo 10 MB y 8 archivos. La respuesta es la solicitud con `documents` actualizados. La `url` abre el archivo.

```http
DELETE /tenant/employees/leave-requests/:requestId/documents/:documentId
```

Quien solo ve su expediente (`ViewOwn`) adjunta y quita los propios. RH con `Update` o `ManageLeave` puede hacerlo en cualquier empleado.

En el portal del empleado las mismas acciones viven en:

```http
POST   /tenant/employee-portal/me/leave-requests/:requestId/documents
DELETE /tenant/employee-portal/me/leave-requests/:requestId/documents/:documentId
```

---

## Permisos que controlan el UI

- `Employee:ViewMenu` → mostrar el módulo en el menú.
- `Employee:Create` → alta de empleado.
- `Employee:Read` → lista y detalle.
- `Employee:Update` → editar datos, arrastre de vacaciones, subir foto, registrar o corregir solicitudes.
- `Employee:Delete` → eliminar perfil.
- `Employee:ManageLeave` → aprobar, rechazar o marcar como pagadas vacaciones, ausencias y horas extras.

## 9. Horas extras

El empleado llena fecha, hora de inicio, hora de término, motivo y observaciones (opcionales). No envíes las horas: el backend las calcula y la respuesta trae `requested_hours`.

```http
POST /tenant/employees/:id/overtime-requests
```

```json
{
  "work_date": "2026-10-26",
  "start_time": "18:00",
  "end_time": "21:00",
  "reason": "Inventario",
  "notes": "Opcional"
}
```

Lista de RH:

```http
GET /tenant/employees/overtime-requests/all?status=pending&page=1&limit=20
```

Cada solicitud incluye `employee` (nombre, puesto, departamento, `monthly_salary`, `daily_salary`, `hourly_rate`), `status`, `reviewer_name`, `reviewed_at`, `review_notes`, `amount`, `paid_amount`, `payer_name` y `paid_at`.

Antes de confirmar, calcula el importe:

```http
GET /tenant/employees/overtime-requests/:requestId/preview?approved_hours=2.5
```

```json
{
  "requested_hours": 3,
  "approved_hours": 2.5,
  "payment": {
    "hourly_rate": 50,
    "double_hours": 2.5,
    "excess_hours": 0,
    "double_multiplier": 2,
    "excess_multiplier": 3,
    "amount": 250,
    "is_estimate": true,
    "prior_week_hours": 0,
    "week_start": "2026-10-26",
    "week_end": "2026-11-01"
  }
}
```

Aprobar o rechazar:

```http
PUT /tenant/employees/overtime-requests/:requestId/review
```

```json
{ "status": "approved", "approved_hours": 2.5, "review_notes": "Se autorizan 2.5 h" }
```

`approved_hours` solo aplica al aprobar. Si se omite, se autorizan las horas solicitadas. Rechazar:

```json
{ "status": "rejected", "review_notes": "No estaba programado" }
```

Cuando nómina paga:

```http
PUT /tenant/employees/overtime-requests/:requestId/pay
```

El estatus pasa a `paid` y `paid_amount` queda igual al `amount` autorizado.

Reglas de pago (pantalla de RH, permiso `Update`):

```http
GET /tenant/employees/overtime/policy
PUT /tenant/employees/overtime/policy
```

```json
{
  "workday_hours": 8,
  "daily_double_hours": 3,
  "weekly_double_hours": 9,
  "double_multiplier": 2,
  "excess_multiplier": 3
}
```

`is_custom: false` significa que aún no se guardó nada y están los defaults de la LFT: jornada de 8 h, primeras 3 h del día y 9 h de la semana al doble, el excedente al triple. La tarifa por hora es el salario diario (`mensual / 30`) dividido entre `workday_hours`.

Mientras está `pending`, se puede corregir con `PUT /tenant/employees/overtime-requests/:requestId`.

En el portal, el mismo cuerpo se manda a `POST /tenant/employee-portal/me/overtime-requests`.

## 10. Horario laboral

El perfil (`GET /:id` y `GET /tenant/employee-portal/me`) incluye `work_schedule`. Si aún no se configuró, viene `null`.

```http
PUT /tenant/employees/:id/work-schedule
PUT /tenant/employee-portal/me/work-schedule
```

```json
{
  "notes": "Turno matutino",
  "days": [
    { "weekday": 1, "is_workday": true, "start_time": "09:00", "end_time": "18:00" },
    { "weekday": 2, "is_workday": true, "start_time": "09:00", "end_time": "18:00" },
    { "weekday": 3, "is_workday": true, "start_time": "09:00", "end_time": "18:00" },
    { "weekday": 4, "is_workday": true, "start_time": "09:00", "end_time": "18:00" },
    { "weekday": 5, "is_workday": true, "start_time": "09:00", "end_time": "18:00" },
    { "weekday": 6, "is_workday": false },
    { "weekday": 7, "is_workday": false }
  ]
}
```

`weekday`: 1 lunes … 7 domingo. En un día laboral, `start_time` y `end_time` son `HH:mm`. Si la salida es menor que la entrada, el turno cruza medianoche. Al menos un día debe ser laboral.

La respuesta es el empleado con `work_schedule.weekly_hours` y `hours` por día.

UI: tabla lun–dom, checkbox laboral, dos `input type="time"`, total de la semana y notas. En el portal el empleado puede guardarlo. En el expediente, RH con `Employee:Update`.
