# Guía de UI — Portal de empleado

Autoservicio para el empleado autenticado. Todos los endpoints requieren:

- Header `Authorization: Bearer <token>`
- Permisos `EmployeePortal:*` y que la cuenta sea de tipo empleado.

Base URL: `/{apiPrefix}/tenant/employee-portal`

---

## 0. Mostrar la entrada al portal

En el login, la respuesta incluye `is_employee`. Muestra la opción **Portal de empleado** (en configuración/menú) solo cuando `is_employee === true` y el usuario tenga `EmployeePortal:ViewMenu`.

```json
{
  "access_token": "…",
  "user": { "id": "…", "is_employee": true, "is_pos_user": false }
}
```

## 1. Mi información

```http
GET /tenant/employee-portal/me
```

Devuelve el perfil completo del empleado autenticado:

```json
{
  "id": "…",
  "first_name": "Juan",
  "last_name": "Pérez",
  "email": "empleado@empresa.mx",
  "position": "Cajero",
  "department": "Ventas",
  "photo_url": "https://…firmada",
  "hire_date": "2022-02-01",
  "years_of_service": 3,
  "vacation": {
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
    "annual_salary": 144000
  },
  "leave_requests": [ … ],
  "work_schedule": {
    "weekly_hours": 45,
    "notes": null,
    "days": [
      { "weekday": 1, "is_workday": true, "start_time": "09:00", "end_time": "18:00", "hours": 9 }
    ]
  }
}
```

Sugerencia UI: tarjeta con foto, puesto, antigüedad y un tablero grande con **Vacaciones disponibles** (`vacation.available_days`).

Si la cuenta no es empleado, responde `403`.

## 2. Actualizar mi perfil (nombre / teléfono / contraseña)

```http
PUT /tenant/employee-portal/me
```

```json
{
  "first_name": "Juan Carlos",
  "last_name": "Pérez López",
  "phone": "+52 55 1234 5678",
  "password": "NuevaClave123"
}
```

Todos los campos son opcionales. `password` requiere mínimo 8 caracteres. La respuesta es el perfil actualizado.

## 3. Cambiar mi foto

```http
POST /tenant/employee-portal/me/photo
Content-Type: multipart/form-data
```

Campo del archivo: `file`. Devuelve el perfil con `photo_url` actualizado.

## 4. Mis solicitudes

```http
GET /tenant/employee-portal/me/leave-requests?status=pending&page=1&limit=20
```

## 5. Solicitar vacaciones / reportar falta

```http
POST /tenant/employee-portal/me/leave-requests
```

```json
{
  "type": "vacation",
  "start_date": "2026-08-01",
  "end_date": "2026-08-05",
  "reason": "Vacaciones familiares"
}
```

- `type`: `vacation` | `absence` | `permission` | `sick_leave`.
- En `vacation`, `days` = días hábiles (lun–vie). Ejemplo: 16–24 abril = 7, no 9.
- Faltas / permisos / incapacidad siguen en días naturales.
- Para `vacation`, si excedes tus días disponibles el backend responde `400`.
- La solicitud queda en `pending` hasta que RH la apruebe/rechace.

## 6. Comprobantes de incapacidad médica

El perfil (`GET /me`) incluye `sick_leave` (días aprobados y en revisión del año) y `documents` en cada solicitud.

```http
POST /tenant/employee-portal/me/leave-requests/:requestId/documents
Content-Type: multipart/form-data
```

Campo `file`: PDF o imagen, máx. 10 MB. Solo en una incapacidad propia, pendiente o aprobada.

```http
DELETE /tenant/employee-portal/me/leave-requests/:requestId/documents/:documentId
```

## 7. Cancelar una solicitud pendiente

```http
PUT /tenant/employee-portal/me/leave-requests/:requestId/cancel
```

Solo puedes cancelar tus propias solicitudes en estatus `pending`.

---

## Errores comunes

| Código | Causa                                                         |
| ------ | ------------------------------------------------------------- |
| 400    | Fechas inválidas, horario empalmado o días de vacaciones insuficientes. |
| 401    | Token ausente o inválido.                                    |
| 403    | La cuenta no es de tipo empleado, o sin permiso `EmployeePortal:*`. |
| 404    | Solicitud no encontrada.                                     |

## 8. Horas extras

```http
POST /tenant/employee-portal/me/overtime-requests
```

```json
{
  "work_date": "2026-10-26",
  "start_time": "18:00",
  "end_time": "21:00",
  "reason": "Cierre de caja",
  "notes": "Opcional"
}
```

La respuesta incluye `requested_hours` calculadas con el horario. `notes` es opcional. La fecha no puede ser futura.

```http
GET /tenant/employee-portal/me/overtime-requests?status=pending
PUT /tenant/employee-portal/me/overtime-requests/:requestId
```

El `PUT` solo corrige una solicitud `pending` del empleado autenticado. El estatus (`pending`, `approved`, `rejected`, `paid`), quién autorizó (`reviewer_name`, `reviewed_at`) y cuánto se pagó (`amount`, `paid_amount`, `paid_at`) vienen en cada fila. La revisión y el pago los hace RH en el módulo de empleados.

## 9. Mi horario laboral

`GET /me` incluye `work_schedule` (`null` si aún no hay). El empleado lo guarda así:

```http
PUT /tenant/employee-portal/me/work-schedule
```

Cuerpo: `days` (1 lunes … 7 domingo, `is_workday`, `start_time`, `end_time`) y `notes` opcional. La respuesta es el perfil con `weekly_hours`.

UI: sección **Horario laboral** debajo de las cards. Checkbox por día, entrada/salida, total de la semana y **Guardar horario**.
