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
    "taken_days": 5,
    "pending_days": 2,
    "available_days": 9,
    "current_period_start": "2025-02-01"
  },
  "payroll": {
    "monthly_salary": 12000,
    "daily_salary": 400,
    "biweekly_salary": 6000,
    "annual_salary": 144000
  },
  "leave_requests": [ … ]
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
- Los `days` se calculan automáticamente (días naturales inclusivos).
- Para `vacation`, si excedes tus días disponibles el backend responde `400`.
- La solicitud queda en `pending` hasta que RH la apruebe/rechace.

## 6. Cancelar una solicitud pendiente

```http
PUT /tenant/employee-portal/me/leave-requests/:requestId/cancel
```

Solo puedes cancelar tus propias solicitudes en estatus `pending`.

---

## Errores comunes

| Código | Causa                                                         |
| ------ | ------------------------------------------------------------- |
| 400    | Fechas inválidas o días de vacaciones insuficientes.         |
| 401    | Token ausente o inválido.                                    |
| 403    | La cuenta no es de tipo empleado, o sin permiso `EmployeePortal:*`. |
| 404    | Solicitud no encontrada.                                     |
