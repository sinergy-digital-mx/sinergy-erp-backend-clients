# Guía de UI — Empleados

Cómo consumir el módulo desde el frontend. Todos los endpoints requieren:

- Header `Authorization: Bearer <token>`
- Permisos `Employee:*` y el módulo habilitado.

Base URL: `/{apiPrefix}/tenant/employees`

---

## 1. Marcar un usuario como empleado (modal de usuario, tab "Empleado")

El perfil de empleado se administra desde el modal de usuario existente. Al activar el toggle **Empleado**, muestra los campos de RH/nómina y envíalos dentro del objeto `employee` al crear/editar el usuario.

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
    "monthly_salary": 12000,
    "payment_frequency": "biweekly",
    "bank_name": "BBVA",
    "clabe": "012345678901234567",
    "bank_account": "0123456789"
  }
}
```

- Si `is_employee` es `true`, el backend hace **upsert** del perfil y marca al usuario como empleado.
- Si `is_employee` es `false`, se desmarca al usuario (se conserva el historial del empleado).
- La respuesta de `GET /tenant/users/:userId` incluye `is_employee` y el objeto `employee` (con `vacation`, `payroll` y `photo_url`) para precargar el modal.

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
        "taken_days": 5,
        "pending_days": 2,
        "available_days": 9,
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
  "start_date": "2026-08-01",
  "end_date": "2026-08-05",
  "reason": "Vacaciones de verano",
  "is_paid": true
}
```

`days` se calcula solo. Para `vacation` se valida contra los días disponibles.

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

---

## Permisos que controlan el UI

- `Employee:ViewMenu` → mostrar el módulo en el menú.
- `Employee:Create` → alta de empleado.
- `Employee:Read` → lista y detalle.
- `Employee:Update` → editar datos, subir foto, registrar solicitudes.
- `Employee:Delete` → eliminar perfil.
- `Employee:ManageLeave` → aprobar/rechazar/cancelar solicitudes.
