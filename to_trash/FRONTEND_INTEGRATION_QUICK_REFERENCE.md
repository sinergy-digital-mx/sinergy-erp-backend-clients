# Guía Rápida de Integración Frontend

## Documentos Disponibles

Esta guía te ayudará a encontrar rápidamente la información que necesitas para integrar tu frontend con el backend.

---

## 📦 Módulos Principales

### 1. Productos (Products)
**Documento:** `PRODUCTS_COMPLETE_GUIDE.md`

**Endpoints principales:**
- `GET /api/tenant/products` - Listar productos
- `POST /api/tenant/products` - Crear producto
- `GET /api/tenant/products/:id` - Obtener producto
- `PUT /api/tenant/products/:id` - Actualizar producto
- `DELETE /api/tenant/products/:id` - Eliminar producto

**Incluye:**
- Categorías y subcategorías
- Unidades de medida (UoM) y conversiones
- Precios por proveedor
- Fotos de productos (S3)
- Integración con listas de precios
- Integración con inventario

---

### 2. Inventario (Inventory)
**Documento:** `INVENTORY_COMPLETE_GUIDE.md`

**Endpoints principales:**
- `GET /api/tenant/inventory/items` - Listar stock
- `POST /api/tenant/inventory/movements` - Crear movimiento
- `POST /api/tenant/inventory/transfer` - Transferir entre almacenes
- `POST /api/tenant/inventory/adjust` - Ajustar inventario
- `GET /api/tenant/inventory/reports/stock-by-warehouse` - Reporte de stock
- `GET /api/tenant/inventory/reports/by-product/:productId` - Movimientos por producto

**Incluye:**
- Gestión de stock por almacén
- Movimientos de inventario
- Reservas de stock
- Métodos de valorización (FIFO, LIFO, Weighted Average)
- Integración automática con Purchase Orders y Sales Orders
- Reportes de stock y valorización

---

### 3. Órdenes de Compra (Purchase Orders)
**Documento:** `PURCHASE_ORDERS_API_GUIDE.md`

**Endpoints principales:**
- `GET /api/tenant/purchase-orders` - Listar órdenes
- `POST /api/tenant/purchase-orders` - Crear orden (con line_items)
- `GET /api/tenant/purchase-orders/:id` - Obtener orden
- `PUT /api/tenant/purchase-orders/:id` - Actualizar orden
- `PUT /api/tenant/purchase-orders/:id/status` - Cambiar estado

**Incluye:**
- Crear órdenes con productos (line_items)
- Estados: Borrador, Enviada, Recibida, Cancelada
- Integración automática con inventario al recibir
- Pagos y documentos adjuntos

---

### 4. Órdenes de Venta (Sales Orders)
**Documento:** `SALES_ORDERS_COMPLETE_GUIDE.md`

**Endpoints principales:**
- `GET /api/tenant/sales-orders` - Listar órdenes
- `POST /api/tenant/sales-orders` - Crear orden (con line_items)
- `GET /api/tenant/sales-orders/:id` - Obtener orden
- `PUT /api/tenant/sales-orders/:id` - Actualizar orden

**Incluye:**
- Crear órdenes con productos (line_items)
- Estados: draft, confirmed, processing, completed, cancelled
- Integración automática con inventario (reservas y movimientos)
- Cálculo automático de totales e impuestos

---

### 5. Punto de Venta (POS)
**Documento:** `POS_COMPLETE_GUIDE.md`

**Endpoints principales:**
- `POST /api/tenant/pos/cash-shifts` - Abrir turno de caja
- `POST /api/tenant/pos/orders` - Crear orden POS
- `POST /api/tenant/pos/orders/:id/payment` - Procesar pago
- `POST /api/tenant/pos/cash-shifts/:id/close` - Cerrar turno

**Incluye:**
- Arquitectura de dos pantallas (mesero y cajero)
- Gestión de turnos de caja
- Órdenes y pagos
- Integración con inventario
- Reportes de ventas

---

### 6. Listas de Precios (Price Lists)
**Documentos:** 
- `PRICE_LISTS_GUIDE.md` - Guía completa
- `PRICE_LISTS_INTEGRATION.md` - Integración con otros módulos

**Endpoints principales:**
- `GET /api/tenant/price-lists` - Listar listas de precios
- `POST /api/tenant/price-lists` - Crear lista
- `POST /api/tenant/price-lists/:id/products` - Agregar precio de producto
- `GET /api/tenant/price-lists/products/:productId/prices` - Precios de un producto

**Incluye:**
- Múltiples listas (Menudeo, Mayoreo, VIP, etc.)
- Precios por producto y UoM
- Descuentos y fechas de validez
- Integración con POS y Sales Orders

---

## 🔐 Autenticación

Todos los endpoints requieren autenticación JWT:

```typescript
// En Angular
import { HttpHeaders } from '@angular/common/http';

const headers = new HttpHeaders({
  'Authorization': `Bearer ${token}`
});

this.http.get('/api/tenant/products', { headers });
```

El token incluye automáticamente:
- `tenantId`: ID del tenant (multi-tenancy)
- `userId`: ID del usuario autenticado

**No es necesario enviar estos campos en el body**.

---

## 🔒 Permisos RBAC

Cada módulo tiene sus propios permisos:

| Módulo | Permisos |
|--------|----------|
| Products | `products:Create`, `products:Read`, `products:Update`, `products:Delete` |
| Inventory | `inventory:Create`, `inventory:Read`, `inventory:Update`, `inventory:Delete` |
| Purchase Orders | `purchase_orders:Create`, `purchase_orders:Read`, `purchase_orders:Update`, `purchase_orders:Delete` |
| Sales Orders | `sales_orders:Create`, `sales_orders:Read`, `sales_orders:Update`, `sales_orders:Delete` |
| POS | `pos:Create`, `pos:Read`, `pos:Update`, `pos:Delete` |
| Price Lists | `PriceList:Create`, `PriceList:Read`, `PriceList:Update`, `PriceList:Delete` |

**Validar permisos en el frontend:**
```typescript
export class AuthService {
  hasPermission(permission: string): boolean {
    return this.currentUser?.permissions?.includes(permission) || false;
  }
}
```

---

## 🔄 Integraciones Automáticas

### Purchase Orders → Inventory
Cuando una orden de compra cambia a estado "Recibida":
- ✅ Se crean movimientos de inventario automáticamente
- ✅ Se incrementa el stock en el almacén
- ✅ Se actualiza la valorización

**No requiere acción del frontend**.

### Sales Orders → Inventory
Cuando una orden de venta cambia de estado:
- `draft` → `confirmed`: Crea reservas de stock
- `confirmed` → `completed`: Crea movimientos de inventario
- `confirmed` → `cancelled`: Cancela reservas

**No requiere acción del frontend**.

---

## 📊 Reportes Disponibles

### Inventario
- Stock por almacén: `GET /api/tenant/inventory/reports/stock-by-warehouse`
- Movimientos por período: `GET /api/tenant/inventory/reports/movements-by-period`
- Valorización: `GET /api/tenant/inventory/reports/valuation`
- Stock bajo: `GET /api/tenant/inventory/reports/low-stock`
- Movimientos por producto: `GET /api/tenant/inventory/reports/by-product/:productId`

### POS
- Ventas diarias: `GET /api/tenant/pos/reports/daily-sales`
- Rendimiento de meseros: `GET /api/tenant/pos/reports/waiter-performance`
- Productos más vendidos: `GET /api/tenant/pos/reports/top-products`

---

## 🚨 Errores Comunes

### 404 Not Found
- Verifica que el endpoint sea correcto
- Asegúrate de que el módulo esté importado en `app.module.ts`

### 401 Unauthorized
- Token JWT inválido o expirado
- Renueva el token de autenticación

### 403 Forbidden
- El usuario no tiene permisos suficientes
- Verifica los permisos RBAC del usuario

### 409 Conflict
- Violación de reglas de negocio (ej: stock insuficiente)
- Lee el mensaje de error para más detalles

### 400 Bad Request
- Datos de entrada inválidos
- Verifica que todos los campos requeridos estén presentes
- Verifica que los UUIDs sean válidos

---

## 📝 Formato de Datos

### Fechas
Usar formato ISO 8601: `YYYY-MM-DDTHH:mm:ss.sssZ`

```typescript
const date = new Date().toISOString();
// "2026-03-09T10:30:00.000Z"
```

### UUIDs
Todos los IDs son UUIDs v4 (excepto `customer_id` que es `int`):

```typescript
// Válido
"258008be-6173-4140-a0df-6f752d691f2c"

// Inválido
"123"
"abc-def"
```

### Números Decimales
Usar números con máximo 2 decimales para precios y cantidades:

```typescript
{
  "unit_price": 10.50,
  "quantity": 100.00
}
```

---

## 🛠️ Herramientas Recomendadas

### Postman / Insomnia
Para probar los endpoints antes de integrar en el frontend.

### Angular HttpClient
```typescript
import { HttpClient } from '@angular/common/http';

constructor(private http: HttpClient) {}

getProducts() {
  return this.http.get('/api/tenant/products');
}
```

### RxJS Operators
```typescript
import { map, catchError } from 'rxjs/operators';

getProducts() {
  return this.http.get('/api/tenant/products').pipe(
    map(response => response.data),
    catchError(error => {
      console.error('Error:', error);
      return [];
    })
  );
}
```

---

## 📞 Soporte

Si encuentras algún error o necesitas ayuda:
1. Revisa el documento específico del módulo
2. Verifica los logs del servidor
3. Consulta la sección de Troubleshooting en cada guía

---

## ✅ Checklist de Integración

- [ ] Configurar autenticación JWT
- [ ] Implementar validación de permisos RBAC
- [ ] Crear servicios Angular para cada módulo
- [ ] Implementar manejo de errores
- [ ] Probar endpoints con Postman
- [ ] Validar formato de datos (UUIDs, fechas, decimales)
- [ ] Implementar paginación en listados
- [ ] Agregar loading states en el UI
- [ ] Implementar refresh de datos después de operaciones
- [ ] Probar integraciones automáticas (PO → Inventory, SO → Inventory)

