# POS Sessions API - Guía de Implementación

## Descripción General

El módulo de sesiones POS (`pos_sessions`) permite gestionar las sesiones de caja para puntos de venta. Cada sesión representa un turno de trabajo donde un cajero/vendedor abre la caja con un monto inicial, procesa ventas, y cierra la sesión con el conteo final de efectivo.

## Características Principales

### Reglas de Negocio

1. **Una sesión abierta por POS**: Solo puede haber una sesión abierta por `pos_configuration_id` a la vez
2. **Múltiples sesiones por día**: Puede haber varias sesiones en el mismo día para el mismo equipo y usuario, siempre que la anterior esté cerrada
3. **Sesiones simultáneas por usuario**: Un usuario puede tener sesiones abiertas en diferentes equipos POS simultáneamente
4. **Numeración secuencial**: Cada POS tiene su propia secuencia de números de sesión
5. **Conciliación automática**: Al cerrar, se calcula automáticamente el efectivo esperado vs. el real

### Estructura de Datos

```typescript
{
  id: string;                      // UUID
  tenant_id: string;               // ID del tenant
  pos_configuration_id: string;    // ID del equipo POS
  user_id: string;                 // ID del usuario que abrió la sesión
  session_number: number;          // Número secuencial por POS
  
  // Tiempos
  opened_at: Date;                 // Fecha/hora de apertura
  closed_at: Date | null;          // Fecha/hora de cierre
  
  // Gestión de efectivo
  opening_cash: number;            // Efectivo inicial
  closing_cash: number | null;     // Efectivo final contado
  expected_cash: number | null;    // Efectivo esperado (calculado)
  cash_difference: number | null;  // Diferencia (closing - expected)
  
  // Estado y tracking
  status: 'open' | 'closed' | 'suspended';
  total_sales: number;             // Total de ventas en la sesión
  total_transactions: number;      // Número de transacciones
  notes: string | null;            // Notas opcionales
  closed_by: string | null;        // Usuario que cerró (si es diferente)
}
```

## Endpoints de la API

### 1. Abrir Sesión

**POST** `/api/tenant/pos-sessions/open`

Abre una nueva sesión POS. Valida que no exista una sesión abierta para el mismo equipo.

**Request Body:**
```json
{
  "pos_configuration_id": "uuid-del-pos",
  "opening_cash": 500.00,
  "notes": "Inicio de turno matutino"
}
```

**Response (201):**
```json
{
  "id": "session-uuid",
  "tenant_id": "tenant-uuid",
  "pos_configuration_id": "pos-uuid",
  "user_id": "user-uuid",
  "session_number": 15,
  "opened_at": "2024-01-15T08:00:00Z",
  "opening_cash": 500.00,
  "status": "open",
  "total_sales": 0,
  "total_transactions": 0,
  "notes": "Inicio de turno matutino"
}
```

**Errores:**
- `409 Conflict`: Ya existe una sesión abierta para este POS

---

### 2. Cerrar Sesión

**PATCH** `/api/tenant/pos-sessions/:id/close`

Cierra una sesión abierta, calcula la diferencia de efectivo y actualiza el estado.

**Request Body:**
```json
{
  "closing_cash": 1250.50,
  "notes": "Fin de turno, todo correcto"
}
```

**Response (200):**
```json
{
  "id": "session-uuid",
  "status": "closed",
  "closed_at": "2024-01-15T16:00:00Z",
  "opening_cash": 500.00,
  "closing_cash": 1250.50,
  "expected_cash": 1200.00,
  "cash_difference": 50.50,
  "total_sales": 700.00,
  "total_transactions": 25,
  "closed_by": "user-uuid"
}
```

**Errores:**
- `404 Not Found`: Sesión no encontrada
- `400 Bad Request`: La sesión no está abierta

---

### 3. Listar Sesiones

**GET** `/api/tenant/pos-sessions`

Lista todas las sesiones con filtros opcionales y paginación.

**Query Parameters:**
- `page` (number): Número de página (default: 1)
- `limit` (number): Registros por página (default: 10)
- `pos_configuration_id` (uuid): Filtrar por equipo POS
- `user_id` (uuid): Filtrar por usuario
- `status` (enum): Filtrar por estado (open, closed, suspended)
- `from_date` (date): Sesiones desde esta fecha
- `to_date` (date): Sesiones hasta esta fecha

**Ejemplo:**
```
GET /api/tenant/pos-sessions?status=open&pos_configuration_id=abc-123
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "session-uuid",
      "session_number": 15,
      "opened_at": "2024-01-15T08:00:00Z",
      "status": "open",
      "opening_cash": 500.00,
      "total_sales": 350.00,
      "posConfiguration": {
        "id": "pos-uuid",
        "code": "POS-001",
        "sucursal": "branch-uuid"
      },
      "user": {
        "id": "user-uuid",
        "name": "Juan Pérez"
      }
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

---

### 4. Obtener Sesión por ID

**GET** `/api/tenant/pos-sessions/:id`

Obtiene los detalles completos de una sesión específica.

**Response (200):**
```json
{
  "id": "session-uuid",
  "tenant_id": "tenant-uuid",
  "pos_configuration_id": "pos-uuid",
  "user_id": "user-uuid",
  "session_number": 15,
  "opened_at": "2024-01-15T08:00:00Z",
  "closed_at": null,
  "opening_cash": 500.00,
  "status": "open",
  "total_sales": 350.00,
  "total_transactions": 12,
  "posConfiguration": { /* detalles del POS */ },
  "user": { /* detalles del usuario */ }
}
```

---

### 5. Obtener Sesión Actual de un POS

**GET** `/api/tenant/pos-sessions/current/:posConfigId`

Obtiene la sesión actualmente abierta para un equipo POS específico.

**Response (200):**
```json
{
  "id": "session-uuid",
  "session_number": 15,
  "opened_at": "2024-01-15T08:00:00Z",
  "status": "open",
  "opening_cash": 500.00,
  "total_sales": 350.00,
  "total_transactions": 12
}
```

**Response (404):** Si no hay sesión abierta

---

## Integración con Ventas

El servicio incluye un método interno `updateSessionSales()` que debe ser llamado cada vez que se procesa una venta:

```typescript
await posSessionService.updateSessionSales(
  sessionId,
  saleAmount,
  tenantId
);
```

Este método:
- Incrementa `total_sales` con el monto de la venta
- Incrementa `total_transactions` en 1
- Se usa para calcular el `expected_cash` al cerrar

---

## Permisos Requeridos

- `PosSession:Create` - Abrir sesiones
- `PosSession:Read` - Consultar sesiones
- `PosSession:Update` - Cerrar sesiones

---

## Casos de Uso

### Flujo Normal de Trabajo

1. **Inicio de turno**
   - Cajero llega y cuenta el efectivo inicial
   - Abre sesión con `POST /pos-sessions/open`
   - Sistema valida que no haya sesión abierta

2. **Durante el turno**
   - Se procesan ventas normalmente
   - Cada venta actualiza `total_sales` y `total_transactions`
   - Frontend puede consultar sesión actual con `GET /pos-sessions/current/:posConfigId`

3. **Fin de turno**
   - Cajero cuenta el efectivo final
   - Cierra sesión con `PATCH /pos-sessions/:id/close`
   - Sistema calcula diferencia automáticamente
   - Si hay diferencia, se registra en `cash_difference`

### Múltiples Turnos

```
Día 1:
- 08:00 - Usuario A abre sesión #1 en POS-001
- 14:00 - Usuario A cierra sesión #1
- 14:30 - Usuario B abre sesión #2 en POS-001
- 22:00 - Usuario B cierra sesión #2

Simultáneo:
- Usuario A puede tener sesión abierta en POS-001
- Usuario A puede tener sesión abierta en POS-002 al mismo tiempo
```

---

## Migración de Base de Datos

Ejecutar el script SQL en `migrations/create_pos_sessions_table.sql`

---

## Próximos Pasos

1. Ejecutar la migración SQL
2. Registrar los permisos en RBAC:
   - `PosSession:Create`
   - `PosSession:Read`
   - `PosSession:Update`
3. Integrar llamadas a `updateSessionSales()` en el módulo de ventas
4. Implementar UI para gestión de sesiones
5. Considerar agregar reportes de sesiones con diferencias de efectivo

---

## Notas Técnicas

- La constraint `UQ_pos_sessions_open_per_config` requiere MySQL 8.0+ para índices funcionales
- En versiones anteriores, la validación se hace a nivel de aplicación
- Los campos `expected_cash` y `cash_difference` se calculan automáticamente al cerrar
- El campo `closed_by` permite rastrear si un supervisor cerró la sesión de otro usuario
